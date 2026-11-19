#!/usr/bin/env python3
"""Verify the production image against an empty isolated PostgreSQL and RabbitMQ."""
import json
import pathlib
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid

image = sys.argv[1]
network = 'shop-smoke-' + uuid.uuid4().hex[:10]
containers = []


def docker(*args):
    return subprocess.check_output(['docker', *args], text=True).strip()


def start(name, *args):
    containers.append(name)
    docker('run', '-d', '--name', name, '--network', network, *args)


def wait(name, *command):
    for _ in range(60):
        if subprocess.run(['docker', 'exec', name, *command], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
            return
        time.sleep(1)
    raise RuntimeError(f'{name} startup timeout')


shop_check = r'''
const assert = require('node:assert/strict');
const amqp = require('amqplib');
const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const { firstValueFrom, timeout } = require('rxjs');
const client = ClientProxyFactory.create({transport: Transport.RMQ, options: {
  urls: [{hostname: 'broker', port: 5672, username: 'smoke', password: 'smoke'}],
  queue: 'shop_srv.command.queue', queueOptions: {durable: true},
}});
const request = (cmd, data) => firstValueFrom(client.send({cmd}, data).pipe(timeout(5000)));
(async () => {
  let broker;
  try {
    broker = await amqp.connect({hostname: 'broker', username: 'smoke', password: 'smoke'});
    const channel = await broker.createChannel();
    await channel.assertExchange('event.exchange', 'topic', {durable: true});
    const queue = await channel.assertQueue('', {exclusive: true});
    await channel.bindQueue(queue.queue, 'event.exchange', 'shop.*');
    const events = [];
    await channel.consume(queue.queue, message => {
      if (message) events.push(JSON.parse(message.content.toString()).data);
    }, {noAck: true});
    const initial = await request('shop.getAll', {});
    assert.equal(initial.meta.totalRows, 0);
    const created = await request('shop.create', {
      name: 'Deployment shop',
      contacts: [{type: 'email', purpose: 'support', value: 'shop@example.test', isPublic: true, sortOrder: 0}],
      addresses: [{type: 'pickup', address: 'Smoke address'}],
    });
    assert.equal(created.version, 1);
    assert.equal(created.contacts.length, 1);
    assert.equal(created.addresses.length, 1);
    const updated = await request('shop.update', {uuid: created.uuid, version: 1, name: 'Updated deployment shop'});
    assert.equal(updated.version, 2);
    const current = await request('shop.getByUuid', {uuid: created.uuid});
    assert.equal(current.name, 'Updated deployment shop');
    const search = await request('shop.getAll', {term: 'Upda depl'});
    assert.equal(search.meta.totalRows, 1);
    assert.equal(search.data[0].uuid, created.uuid);
    await assert.rejects(request('shop.update', {uuid: created.uuid, version: 1, name: 'Stale update'}), error => error.statusCode === 409);
    await assert.rejects(request('shop.create', {name: ''}), error => error.statusCode === 400);
    for (let attempt = 0; attempt < 40 && events.length < 2; attempt++) await new Promise(resolve => setTimeout(resolve, 250));
    assert.deepEqual(events.map(event => Number(event.aggregateVersion)), [1, 2]);
    assert.deepEqual(events.map(event => event.eventType), ['shop.created', 'shop.updated']);
    assert.equal(events[1].payload.name, updated.name);
    console.log('RMQ create/read/update/search/version conflict/validation and ordered outbox events passed');
  } finally { await client.close(); if (broker) await broker.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
'''

try:
    docker('network', 'create', network)
    broker = network + '-broker'
    start(broker, '--user', '999:999', '--tmpfs', '/var/lib/rabbitmq:uid=999,gid=999,mode=0700',
          '--network-alias', 'broker', '-e', 'RABBITMQ_DEFAULT_USER=smoke', '-e', 'RABBITMQ_DEFAULT_PASS=smoke',
          'rabbitmq:4.4.1-management@sha256:61f90c401a5b5ed2486771973ea92ad66046471eacab9c9149f1a6e091c91677')
    wait(broker, 'rabbitmq-diagnostics', '-q', 'ping')
    database = network + '-db'
    start(database, '--network-alias', 'database', '-e', 'POSTGRES_USER=shop_srv',
          '-e', 'POSTGRES_PASSWORD=smoke', '-e', 'POSTGRES_DB=shop_srv',
          'postgres:16.16-bookworm@sha256:ce3efec6bc404f6b15ebf5d9bed6b45a9d4655aea238d7dacc3467ccb05a1175')
    wait(database, 'pg_isready', '-U', 'shop_srv')
    values = {}
    for line in pathlib.Path('code/.env.example').read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            values[key] = value.strip().strip('"')
    values.update(PORT='8080', AMQP_HOSTNAME='broker', AMQP_USERNAME='smoke', AMQP_PASSWORD='smoke',
                  DATABASE_HOST='database', DATABASE_PORT='5432', DATABASE_USERNAME='shop_srv',
                  DATABASE_PASSWORD='smoke', DATABASE_DATABASE_NAME='shop_srv')
    with tempfile.TemporaryDirectory() as directory:
        env = pathlib.Path(directory) / '.env'
        env.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
        env.chmod(0o644)
        mount = ['--mount', f'type=bind,src={env},dst=/app/.env,readonly']
        for _ in range(2):
            docker('run', '--rm', '--network', network, *mount, image, 'node', '--env-file=.env',
                   'node_modules/typeorm/cli.js', '-d', 'dist/database/data-source.js', 'migration:run')
        migration_count = docker('exec', database, 'psql', '-U', 'shop_srv', '-d', 'shop_srv', '-Atc',
                                 'SELECT count(*) FROM migrations')
        assert migration_count == '9', f'Expected nine migrations, got {migration_count}'
        app = network + '-app'
        start(app, '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--tmpfs', '/tmp',
              '-p', '127.0.0.1::8080', *mount, image)
        host_port = json.loads(docker('inspect', app))[0]['NetworkSettings']['Ports']['8080/tcp'][0]['HostPort']
        for _ in range(90):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{host_port}/health', timeout=2) as response:
                    if json.load(response)['status'] == 'ok':
                        break
            except (OSError, ValueError):
                pass
            if docker('inspect', '--format', '{{.State.Running}}', app) != 'true':
                raise RuntimeError('Shop exited during startup')
            time.sleep(1)
        else:
            raise RuntimeError('Shop readiness timeout')
        assert docker('exec', app, 'id', '-u') == '1000'
        print(docker('exec', app, 'node', '-e', shop_check))
        # Disconnect only the isolated broker to verify the readiness contract.
        docker('stop', '--time', '5', broker)
        for _ in range(20):
            try:
                urllib.request.urlopen(f'http://127.0.0.1:{host_port}/health', timeout=2).close()
            except urllib.error.HTTPError as error:
                assert error.code == 503
                break
            time.sleep(1)
        else:
            raise RuntimeError('Shop stayed ready after its broker disconnected')
        print('Shop: fresh database, repeat migration, mounted .env, non-root image and readiness passed')
except Exception:
    for name in containers:
        subprocess.run(['docker', 'logs', '--tail', '30', name], check=False)
    raise
finally:
    for name in reversed(containers):
        subprocess.run(['docker', 'rm', '-f', '-v', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(['docker', 'network', 'rm', network], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

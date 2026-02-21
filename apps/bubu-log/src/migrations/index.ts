import * as migration_20260220_045727_payload_init from './20260220_045727_payload_init';
import * as migration_20260220_114214 from './20260220_114214';

export const migrations = [
  {
    up: migration_20260220_045727_payload_init.up,
    down: migration_20260220_045727_payload_init.down,
    name: '20260220_045727_payload_init',
  },
  {
    up: migration_20260220_114214.up,
    down: migration_20260220_114214.down,
    name: '20260220_114214'
  },
];

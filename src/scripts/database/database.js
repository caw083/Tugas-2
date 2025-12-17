import { openDB } from 'idb';

const DATABASE_NAME = 'Story';
const DATABASE_VERSION = 2;
const OBJECT_STORE_NAME = 'saved-stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade: (database) => {
    // Create store only if it doesn't exist (supports upgrades safely)
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, {
        keyPath: 'id',
      });
    }
  },
});

const Database = {
  async putStory(report) {
    if (!Object.hasOwn(report, 'id')) {
      throw new Error('`id` is required to save.');
    }

    return (await dbPromise).put(OBJECT_STORE_NAME, report);
  },

  async getStoryById(id) {
    if (!id) {
      throw new Error('`id` is required.');
    }

    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

    async getAllStory() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

   async removeStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },

};

export default Database;
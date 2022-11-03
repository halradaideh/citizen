const debug = require('debug')('citizen:server');

const { Storage } = require('@google-cloud/storage');

const GS_BUCKET = process.env.CITIZEN_STORAGE_BUCKET;
const GS_KEYPATH = process.env.CITIZEN_GCP_GS_KEYPATH;
if (process.env.CITIZEN_STORAGE === 'gcs' && !GS_BUCKET && !GS_KEYPATH) {
  throw new Error(
    'Google storage requires CITIZEN_STORAGE_BUCKET. Additionally, ensure that either CITIZEN_GCP_GS_KEYPATH is set.'
  );
}

const gcs = new Storage({
  keyFilename: GS_KEYPATH,
});

const googleCloudStorage = {
  type: () => 'gcs',
  setItem: async (path, tarball) => {
    if (!path) {
      throw new Error('path is required.');
    }
    if (!tarball) {
      throw new Error('tarball is required.');
    }

    const file = gcs.bucket(GS_BUCKET).file(path);
    try {
      await file.save(tarball);
      return true;
    } catch (err) {
      console.log(err)
      return false;
    }
  },
  hasItem: async (path) => {
    try {
      const [resource] = await gcs.bucket(GS_BUCKET).file(path).getMetadata();
      if (resource.name) {
        debug(`the item already exist: ${path}.`);
        return true;
      }
    } catch (err) {
      if (err.message.startsWith('No such object:')) {
        debug(`the item doesn't exist: ${path}.`);
        return false;
      }

      throw err;
    }

    debug(`the item doesn't exist: ${path}.`);
    return false;
  },
  getItem: async (path) => {
    const file = await gcs.bucket(GS_BUCKET).file(path);

    return file
      .download({
        // don't set destination here
      })
      .then((data) => data[0]);
  },
};

module.exports = googleCloudStorage;

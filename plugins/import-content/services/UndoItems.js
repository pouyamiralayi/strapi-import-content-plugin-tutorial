'use strict';
const _ = require('lodash');

const queues = {};

const removeImportedFiles = async (fileIds, uploadConfig) => {
  const removePromises = fileIds.map(id =>
    strapi.plugins['upload'].services.upload.remove({id}, uploadConfig)
  );

  return await Promise.all(removePromises);
};

const undoNextItem = async (importConfig, uploadConfig) => {
  const item = queues[importConfig.id].shift();

  if (!item) {
    console.log('undo complete');

    await strapi
      .query('importconfig', 'import-content')
      .update({id: importConfig.id}, {ongoing: false});

    return;
  }

  try {
    await strapi.query(importConfig.contentType)
      .delete({id: item.ContentId})
  } catch (e) {
    console.log(e)
  }
  try {
    const importedFileIds = _.compact(item.importedFiles.fileIds);
    await removeImportedFiles(importedFileIds, uploadConfig);
  } catch (e) {
    console.log(e)
  }
  try {
    await strapi.query('importeditem', 'import-content').delete({
      id: item.id
    });
  } catch (e) {
    console.log(e)
  }

  const {UNDO_THROTTLE} = strapi.plugins['import-content'].config;
  setTimeout(() => undoNextItem(importConfig, uploadConfig), UNDO_THROTTLE);
};

module.exports = {
  undoItems: importConfig =>
    new Promise(async (resolve, reject) => {
      try {
        queues[importConfig.id] = importConfig.importeditems;
      } catch (error) {
        reject(error);
      }

      await strapi
        .query('importconfig', 'import-content')
        .update({id: importConfig.id}, {ongoing: true});

      resolve({
        status: 'undo started',
        importConfigId: importConfig.id
      });

      const uploadConfig = await strapi
        .store({
          environment: strapi.config.environment,
          type: 'plugin',
          name: 'upload'
        })
        .get({key: 'provider'});

      undoNextItem(importConfig, uploadConfig);
    })
};

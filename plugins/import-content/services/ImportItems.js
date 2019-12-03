'use strict';
const _ = require('lodash');
const fileUtils = require('./utils/fileUtils');
const importFields = require('./utils/importFields');
const importMediaFiles = require('./utils/importMediaFiles');

const queues = {};

const importNextItem = async importConfig => {
  const sourceItem = queues[importConfig.id].shift();
  if (!sourceItem) {
    console.log('import complete');

    await strapi
      .query('importconfig', 'import-content')
      .update({id: importConfig.id}, {ongoing: false});

    return;
  }

  try {

    const importedItem = await importFields(
      sourceItem,
      importConfig.fieldMapping
    );

    const savedContent = await strapi.query(importConfig.contentType)
      .create(importedItem)

    const uploadedFiles = await importMediaFiles(
      savedContent,
      sourceItem,
      importConfig
    );
    const fileIds = _.map(_.flatten(uploadedFiles), 'id');

    await strapi.query('importeditem', 'import-content').create({
      importconfig: importConfig.id,
      ContentId: savedContent.id,
      ContentType: importConfig.contentType,
      importedFiles: {fileIds}
    });
  } catch (e) {
    console.log(e)
  }
  const {IMPORT_THROTTLE} = strapi.plugins['import-content'].config;
  setTimeout(() => importNextItem(importConfig), IMPORT_THROTTLE);
};

module.exports = {
  importItems: (importConfig, {contentType, body}) =>
    /*importConfig is the saved record*/
    new Promise(async (resolve, reject) => {
      const importConfigRecord = importConfig;
      console.log('importitems', importConfigRecord);

      try {
        const {items} = await fileUtils.getItemsForFileData({
          contentType, // data type
          body,
          options: importConfigRecord.options
        });

        const skipRows = _.get(importConfig, ['options', 'skipRows'], 0)
        if (items.length > 0) items.splice(0, skipRows)
        queues[importConfigRecord.id] = items;
      } catch (error) {
        reject(error);
      }

      resolve({
        status: 'import started',
        importConfigId: importConfigRecord.id
      });

      importNextItem(importConfigRecord);
    })
};

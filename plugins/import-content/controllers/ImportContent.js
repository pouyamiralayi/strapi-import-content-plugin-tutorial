'use strict';

/**
 * ImportPlugin.js controller
 *
 * @description: A set of functions called "actions" of the `import-content` plugin.
 */
const {
  resolveFileDataFromRequest
} = require('../services/utils/FileDataResolver');

module.exports = {

  /**
   * Default action.
   *
   * @return {Object}
   */
  index: async (ctx) => {
    const entries = await strapi.query('importconfig', 'import-content').find();
    const withCounts = entries.map(entry => ({
      ...entry,
      importedCount: entry.importeditems.length,
      importeditems: []
    }))
    ctx.send(withCounts);
  },

  undo: async ctx => {
    const services = strapi.plugins['import-content'].services;
    const importId = ctx.params.importId;
    const importConfig = await strapi
      .query('importconfig', 'import-content')
      .findOne({id: importId});
    console.log('undo', importId);
    await services['undoitems'].undoItems(
      importConfig
    )
    ctx.send(importConfig)
  },

  delete: async ctx => {
    const importId = ctx.params.importId;
    const res = await strapi.query('importconfig', 'import-content').delete({
      id: importId
    });
    if (res && res.id) {
      ctx.send(res.id);
    } else {
      ctx.response.status = 400 // bad request
      ctx.response.message = 'could not delete: the provided id might be wrong'
    }
  },

  create: async ctx => {
    const services = strapi.plugins['import-content'].services;
    const importConfig = ctx.request.body;
    importConfig.ongoing = true;
    const record = await strapi
      .query('importconfig', 'import-content')
      .create(importConfig);
    console.log('create', record);
    /*contentType here is the data type*/
    const {contentType, body} = await resolveFileDataFromRequest(ctx);
    await services['importitems'].importItems(record, {contentType, body});
    ctx.send(record);
  },


  preAnalyzeImportFile: async ctx => {
    const services = strapi.plugins['import-content'].services;
    /*contentType is the data type*/
    const {contentType, body, options} = await resolveFileDataFromRequest(
      ctx
    );
    try {
      const data = await services['importconfig'].preAnalyzeImportFile({
        contentType,
        body,
        options
      });
      ctx.send(data);
    } catch (error) {
      console.log(error)
      ctx.response.status = 406 // not acceptable
      ctx.response.message = 'could not parse: ' + error
    }
  }
};

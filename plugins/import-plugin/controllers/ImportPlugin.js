'use strict';

/**
 * ImportPlugin.js controller
 *
 * @description: A set of functions called "actions" of the `import-plugin` plugin.
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
    const entries = await strapi.query('importconfig', 'import-plugin').find();

    const withCounts = entries.map(entry => ({
      ...entry,
      importedCount: entry.importeditems.length,
      importeditems: []
    }));

    ctx.send(withCounts);
  },

  undo: async ctx => {
    const importId = ctx.params.importId;

    const importConfig = await strapi
      .query('importconfig', 'import-plugin')
      .findOne({id: importId});

    console.log('undo', importId);

    // ctx.send(importConfig);

    await strapi.plugins['import-plugin'].services['undoitems'].undoItems(
      importConfig
    );
    ctx.send(importConfig)
  },

  delete: async ctx => {
    const importId = ctx.params.importId;
    // console.log(importId)

    const res = await strapi.query('importconfig', 'import-plugin').delete({
      id: importId
    });
    // console.log(res)

    res && res.id && ctx.send({id: res.id});
  },

  create: async ctx => {
    const services = strapi.plugins['import-plugin'].services;
    const importConfig = ctx.request.body;
    // console.log('create', importConfig);
    importConfig.ongoing = true;

    const record = await strapi
      .query('importconfig', 'import-plugin')
      .create(importConfig);
    console.log('create', record);

    ctx.send(record);

    /*contentType here is the data type*/
    const {contentType, body} = await resolveFileDataFromRequest(ctx);

    services['importitems'].importItems(record, {contentType, body});
  },



  preAnalyzeImportFile: async ctx => {
    const services = strapi.plugins['import-plugin'].services;

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
      //TODO: fixme to a valid ctx.response format
      ctx.response.notAcceptable('could not parse', error);
    }
  }
};

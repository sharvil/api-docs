'use babel';

const DocSet = require('./docset');
const Resource = require('./resource');

class Library {
  static RESOURCE_NAME_ = 'docs.json';
  static REFRESH_PERIOD_MS_ = 6 * 60 * 60 * 1000;
  static DEFAULT_DOCSETS_ = new Set([
    'css',
    'dom',
    'dom_events',
    'html',
    'http',
    'javascript'
  ]);

  constructor() {
    this.eventQueue_ = Promise.resolve();
    this.catalog_ = null;

    this.fetchLibrary_();
    setInterval(() => { this.fetchLibrary_(); }, Library.REFRESH_PERIOD_MS_);
  }

  get(id) {
    return this.catalog_[id];
  }

  queryAll() {
    var ret = [];
    for (const id in this.catalog_) {
      ret = ret.concat(this.catalog_[id].queryAll());
    }
    return ret;
  }

  fetchLibrary_() {
    this.eventQueue_ = this.eventQueue_
        .then(() => Resource.get(Library.RESOURCE_NAME_, true))
        .then(text => {
          this.buildCatalog_(JSON.parse(text));
          Resource.collectGarbage(this);
        });
  }

  buildCatalog_(items) {
    const catalog = {};

    var slugs = [];
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      catalog[item.slug] = new DocSet(item);

      slugs.push(item.slug);
    }

    for (let i = 0; i < items.length; ++i) {
      const item = items[i];

      var title = item.name
      if ('version' in item && item.version) {
        title += ' ' + item.version
      }
      var schema = {
        title: title,
        type: 'boolean',
        default: Library.DEFAULT_DOCSETS_.has(item.slug)
      };

      // add explicit group with better title
      var base_key = item.slug;
      if (base_key.indexOf('.') != -1) {
        base_key = base_key.substring(0, base_key.indexOf('.'));
      }
      if (slugs.indexOf(base_key) == -1 && base_key.indexOf('~') != -1) {
        var group_title = item.name + ' ' +
          base_key.substring(base_key.indexOf('~') + 1);
        var props = {}
        props[item.slug.substring(base_key.length + 1)] = schema;
        schema = {
          title: group_title,
          type: 'object',
          properties: props
        };

        atom.config.setSchema('api-docs.' + base_key, schema);
        // only insert the group for the first item in the group
        slugs.push(base_key);
        continue;
      }

      atom.config.setSchema('api-docs.' + item.slug, schema);
    }

    this.catalog_ = catalog;
  }
}

module.exports = Library;

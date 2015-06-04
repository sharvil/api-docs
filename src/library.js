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

    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      catalog[item.slug] = new DocSet(item);

      const schema = {
        title: item.name,
        type: 'boolean',
        default: Library.DEFAULT_DOCSETS_.has(item.slug)
      };

      atom.config.setSchema('api-docs.' + item.slug, schema);
    }

    this.catalog_ = catalog;
  }
}

module.exports = Library;

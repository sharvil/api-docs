'use babel';

const Path = require('path');
const Resource = require('./resource');

class DocSet {
    constructor(item) {
    this.id_ = item.slug;
    this.name_ = item.name;
    this.type_ = item.type;
    this.version_ = item.version;
    this.indexPath_ = item.slug + '/index.json';
    this.dbPath_ = item.slug + '/db.json';
    this.version_ = item.mtime;
    this.sizeBytes_ = item.db_size;
    this.index_ = null;
    this.database_ = null;

    // TODO: dispose the returned disposable...
    atom.config.observe('api-docs.' + this.id_, this.setEnabled_.bind(this));
  }

  get type() {
    return this.type_;
  }

  get name() {
    return this.name_;
  }

  get classNames() {
    return '_content _page _' + this.type_;
  }

  get version() {
    return this.version_;
  }

  setEnabled_(enabled : boolean) {
    if (!enabled) {
      this.index_ = null;
      this.database_ = null;
      return;
    }

    const indexPromise = Resource.getVersion(this.indexPath_, this.version_);
    const dbPromise = Resource.getVersion(this.dbPath_, this.version_);

    Promise.all([indexPromise, dbPromise])
        .then(results => {
          this.index_ = JSON.parse(results[0]);
          this.database_ = JSON.parse(results[1]);

          // Fix up the paths to include the docset name.
          for (var i = 0 ; i < this.index_.entries.length; ++i) {
            this.index_.entries[i].id = this.id_;
            this.index_.entries[i].url = `api-docs://${this.id_}/${this.index_.entries[i].path}`;
          }
        });
  }

  getTitle(path) {
    for (var i = 0; i < this.index_.entries.length; ++i) {
      if (this.index_.entries[i].path == path) {
        return this.index_.entries[i].name;
      }
    }
    return '';
  }

  getContent(path) {
    return this.database_[path];
  }

  queryAll() : Array<Object> {
    if (!this.index_) {
      return [];
    }

    return this.index_.entries;
  }
}

module.exports = DocSet;

'use babel';

const $ = require('jquery');
const SelectListView = require('atom-space-pen-views').SelectListView;

// Load names of available icon on demand.
var IconNames = null;

class QueryView extends SelectListView {
  constructor(word, items) {
    super();

    this.confirmed_ = false;
    this.setViewPromise_ = null;
    this.docView_ = null;
    this.panel_ = atom.workspace.addModalPanel({item: this});

    this.filterEditorView.setText(word);
    this.setMaxItems(50);
    this.setItems(items);
    this.storeFocusedElement();
    this.focusFilterEditor();
  }

  viewForItem(item) {
    icon = this.getIcon_(item.id);
    // HTML escape item.name.
    const text = $('<div/>').text(item.name).html();
    return `<li><div><img class="api-docs-icon" src="atom://api-docs/images/icon-${icon}.png" />${text}</div></li>`;
  }

  confirmed(item) {
    this.confirmed_ = true;
    this.showViewForItem(item);
    this.filterEditorView.blur();
  }

  cancelled() {
    if (!this.confirmed_ && this.docView_) {
      this.docView_.destroy();
    }

    this.panel_.destroy();
  }

  getFilterKey() {
    return 'name';
  }

  showViewForItem(item) {
    if (!this.setViewPromise_) {
      this.setViewPromise_ = atom.workspace.open('api-docs://', { split: 'right', activatePane: false })
          .then(docView => {
            this.docView_ = docView;
            this.docView_.setView(item.url);
          });
    } else {
      this.setViewPromise_ = this.setViewPromise_.then(() => {
        this.docView_.setView(item.url);
      });
    }
  }

  getIcon_(slug) {
    this.lazyLoadIconNames_();

    // find most specific available icon
    // first consider the full slug
    var indices = [slug.length];
    // then consider the substring without the minor version
    if (slug.indexOf('.') != -1) {
      indices.push(slug.indexOf('.'));
    }
    // then consider the substring without the version
    if (slug.indexOf('~') != -1) {
      indices.push(slug.indexOf('~'));
    }
    for (var i = 0; i < indices.length; ++i) {
      var name = slug.substring(0, indices[i]);
      if (IconNames.indexOf(name) != -1) {
        return name;
      }
    }
    // fallback to the full slug (even if it doesn't exist)
    // optionally this could show a default icon?
    return slug;
  }

  lazyLoadIconNames_() {
    if (!IconNames) {
      IconNames = [];
      fs = require('fs');
      path = require('path');
      filenames = fs.readdirSync(path.join(__dirname, '..', 'images'));
      prefix = 'icon-';
      suffix = '.png';
      for (var i = 0; i < filenames.length; ++i) {
        if (filenames[i].startsWith(prefix) && filenames[i].endsWith(suffix)) {
          IconNames.push(filenames[i].substring(prefix.length, filenames[i].length - suffix.length));
        }
      }
    }
  }
}

module.exports = QueryView;

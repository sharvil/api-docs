'use babel';

const $ = require('jquery');
const SelectListView = require('atom-space-pen-views').SelectListView;

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
    // HTML escape item.name.
    const text = $('<div/>').text(item.name).html();
    return `<li><div><img class="api-docs-icon" src="atom://api-docs/images/icon-${item.id}.png" />${text}</div></li>`;
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
}

module.exports = QueryView;

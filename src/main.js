'use babel';

// Demand-load these modules.
var DocView = null;
var QueryView = null;

const CompositeDisposable = require('atom').CompositeDisposable;
const Library = require('./library');
const Url = require('url');

class Application {
  static LAZY_LOAD_DELAY_MS_ = 3000;

  constructor() {
    this.subscriptions_ = new CompositeDisposable();
    this.library_ = new Library();

    setTimeout(this.lazyLoad_.bind(this), Application.LAZY_LOAD_DELAY_MS_);
  }

  activate(state) {
    // Keep all Disposables in a composite so we can clean up easily.
    this.subscriptions_.add(atom.commands.add('atom-workspace', { 'api-docs:search-under-cursor': this.searchUnderCursor_.bind(this) }));
    this.subscriptions_.add(atom.workspace.addOpener(this.opener_.bind(this)));
  }

  deactivate() {
    this.subscriptions_.dispose();
  }

  searchUnderCursor_() {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      return;
    }

    const grammar = editor.getGrammar();
    const selectedText = editor.getSelectedText();
    const wordUnderCursor = editor.getWordUnderCursor({ includeNonWordCharacters: false });
    const items = this.library_.queryAll();

    const searchQuery = selectedText ? selectedText : wordUnderCursor;

    this.lazyLoad_();
    new QueryView(searchQuery, items);
  }

  opener_(url) {
    if (Url.parse(url).protocol == 'api-docs:') {
      this.lazyLoad_();
      return new DocView(this.library_, url);
    }
  }

  lazyLoad_() {
    if (!QueryView) {
      QueryView = require('./query_view');
    }
    if (!DocView) {
      DocView = require('./doc_view');
    }
  }
}

const instance = new Application();
module.exports = {
  config: {
    '_theme': {
      title: 'Theme',
      description: 'This styles the documentation window.',
      type: 'string',
      default: 'Light',
      enum: ['Light', 'Dark']
    }
  },

  activate: function() {
    instance.activate();
  },

  deactivate: function() {
    instance.deactivate();
  }
};

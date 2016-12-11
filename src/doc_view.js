'use babel';

const $ = require('jquery');
const Disposable = require('atom').Disposable;
const Emitter = require('atom').Emitter;
const Highlight = require('./highlight');
const Resource = require('./resource');
const ScrollView = require('atom-space-pen-views').ScrollView;
const Shell = require('shell');
const Url = require('url');

class DocView extends ScrollView {
  static DOC_STYLE_LIGHT_ = '';
  static DOC_STYLE_DARK_ = '';
  static DOC_STYLE_PROMISE_ = Resource.get('style-light.css').then(result => DocView.DOC_STYLE_LIGHT_ = result)
      .then(() => Resource.get('style-dark.css')).then(result => DocView.DOC_STYLE_DARK_ = result);

  static content() {
    // Magic required to enable scrolling and keyboard shortcuts for scrolling.
    return this.div({class: 'api-docs-doc native-key-bindings', tabindex: -1});
  }

  constructor(library, url) {
    super();
    this.emitter_ = new Emitter();
    this.library_ = library;
    this.title_ = 'Loading...';
    this.url_ = url;
    this.pane_ = null;
  }

  setView(url) {
    // Set the view only after DOC_STYLE_{LIGHT|DARK}_ are set.
    DocView.DOC_STYLE_PROMISE_.then(() => {
      const parsedUrl = Url.parse(url, true);
      var path = parsedUrl.pathname.substr(1);
      // The hostname part of the url may contain a tilde if the slug does.
      // Therefore this can't rely on Url.parse() to determine the hostname and path.
      var hostname = parsedUrl.hostname;
      var indexAfterHostname = parsedUrl.protocol.length + 2 + parsedUrl.hostname.length;
      if (url.substr(indexAfterHostname, 1) == '~') {
        tildePart = url.substring(indexAfterHostname, url.indexOf('/', indexAfterHostname));
        // move tilde part from path to hostname
        path = path.substring(tildePart.length + 1);
        hostname += tildePart;
      }
      var docset = this.library_.get(hostname);
      if (!docset && path.startsWith('~') && url.substr(indexAfterHostname, 1) != '~') {
        // relative links from other views come already modified with the tilde in the path
        tildePart = path.substring(0, path.indexOf('/'));
        // move tilde part from path to hostname
        path = path.substring(tildePart.length + 1);
        hostname += tildePart;
        docset = this.library_.get(hostname);
      }

      let style = DocView.DOC_STYLE_LIGHT_;
      let styleClass = '#fff';
      if (atom.config.get('api-docs._theme') == 'Dark') {
        style = DocView.DOC_STYLE_DARK_;
        styleClass = '#303030';
      }

      const root = this.element.createShadowRoot();
      root.innerHTML = `<style type="text/css">${style}</style>`;
      root.innerHTML += `<div class="${docset.classNames}" style="font-size: 10pt; background-color: ${styleClass}">${docset.getContent(path)}</div>`;

      // Set up click handlers for relative URLs so we can resolve internally.
      const elements = $(root).find('a');
      for (let i = 0; i < elements.length; ++i) {
        const href = elements[i].getAttribute('href');
        if (!href) {
          continue;
        }

        if (href.startsWith('http')) {
          elements[i].onclick = event => Shell.openExternal(href);
        } else {
          elements[i].onclick = event => this.setView(Url.resolve(url, href));
        }
      }

      Highlight(docset.type, root);

      // Scroll to element with passed id
      if (parsedUrl.hash) {
        // escape special characters in selector
        const hash = parsedUrl.hash.replace('.', '\\.');
        const foundElements = $(root).find(hash);
        if (foundElements) {
          const foundElement = foundElements[0];
          $($(root).find('div')[0]).scrollTop(foundElement.offsetTop);
        }
      }

      this.title_ = docset.getTitle(path);
      this.emitter_.emit('did-change-title');
    });
  }

  destroy() {
    this.pane_.destroyItem(this);
    if (this.pane_.getItems().length === 0) {
      this.pane_.destroy();
    }
  }

  attached() {
    this.pane_ = atom.workspace.paneForURI(this.getURI());
    this.pane_.activateItem(this);
  }

  onDidChangeTitle(callback) {
    return this.emitter_.on('did-change-title', callback);
  }

  onDidChangeModified(callback) {
    return new Disposable();
  }

  // Required to find the pane for this instance.
  getURI() {
    return this.url_;
  }

  getTitle() {
    return this.title_;
  }
}

module.exports = DocView;

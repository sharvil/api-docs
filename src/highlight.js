'use babel';

const $ = require('jquery');
const Prism = require('prismjs');
const Url = require('url');

const Highlight = function(type, rootNode) {
  if (type in Highlight) {
    Highlight[type](rootNode);
  }
};

Highlight.one = (node, language) => {
  node.classList.add('language-' + language);
  Prism.highlightElement(node);
};

Highlight.all = (nodes, language) => {
  for (let i = 0; i < nodes.length; ++i) {
    Highlight.one(nodes[i], language);
  }
};

Highlight.angular = rootNode => {
  const elements = rootNode.getElementsByTagName('pre');
  for (let i = 0; i < elements.length; ++i) {
    const element = elements[i];
    let language = 'javascript';
    if (element.classList.contains('lang-html') || element.textContent[0] == '<') {
      language = 'markup';
    } else if (element.classList.contains('lang-css')) {
      language = 'css';
    }
    element.className = '';
    Highlight.one(element, language);
  }
};

Highlight.bower = rootNode => {
  Highlight.all($(rootNode).find('pre[data-lang="js"], pre[data-lang="json"]'), 'javascript');
};

Highlight.c = rootNode => {
  Highlight.all($(rootNode.find('pre.source-c, .source-c > pre')), 'c');
  Highlight.all($(rootNode.find('pre.source-cpp, .source-cpp > pre')), 'cpp');
};

Highlight.coffeescript = rootNode => {
  Highlight.all($(rootNode).find('.code > pre:first-child'), 'coffeescript');
  Highlight.all($(rootNode).find('.code > pre:last-child'), 'javascript');
};

Highlight.d3 = rootNode => {
  Highlight.all($(rootNode).find('.highlight > pre'));
};

Highlight.ember = rootNode => {
  const elements = rootNode.getElementsByTagName('pre');
  for (let i = 0; i < elements.length; ++i) {
    const element = elements[i];
    if (element.classList.contains('javascript')) {
      Highlight.one(element, 'javascript');
    } else if (element.classList.contains('html')) {
      Highlight.one(element, 'markup');
    }
  }
};

Highlight.go = rootNode => {
  Highlight.all(rootNode.getElementsByTagName('pre'), 'go');
};

// TODO: jquery

Highlight.knockout = rootNode => {
  const elements = rootNode.getElementsByTagName('pre');
  for (let i = 0; i < elements.length; ++i) {
    const element = elements[i];
    if (element.innerHTML.indexOf('data-bind="') > 0) {
      Highlight.one(element, 'markup');
    } else {
      Highlight.one(element, 'javascript');
    }
  }
};

Highlight.mdn = rootNode => {
  const elements = $(rootNode).find('pre[class^="brush"]');
  for (let i = 0; i < elements.length; ++i) {
    const language = elements[i].className.match(/brush: ?(\w+)/)[1].replace('html', 'markup').replace('js', 'javascript');
    elements[i].className = '';
    Highlight.one(elements[i], language);
  }
};

Highlight.php = rootNode => {
  Highlight.all(rootNode.getElementsByClassName('phpcode'), 'php');
};

Highlight.phpunit = rootNode => {
  Highlight.all($(rootNode).find('pre.programlisting'), 'php');
};

Highlight.rdoc = rootNode => {
  Highlight.all($(rootNode).find('pre.ruby'), 'ruby');
  Highlight.all($(rootNode).find('pre.c'), 'clike');
};

Highlight.react = rootNode => {
  const elements = rootNode.getElementsByTagName('pre');
  for (let i = 0; i < elements.length; ++i) {
    const element = elements[i];
    const attribute = element.getAttribute('data-lang');
    if (attribute == 'html') {
      Highlight.one(element, 'markup');
    } else if (attribute == 'javascript') {
      Highlight.one(element, 'javascript');
    }
  }
};

Highlight.sphinx = rootNode => {
  Highlight.all($(rootNode).find('pre.python'), 'python');
  Highlight.all($(rootNode).find('pre.markup'), 'markup');
};

Highlight.chai =
Highlight.express =
Highlight.grunt =
Highlight.lodash =
Highlight.marionette =
Highlight.modernizr =
Highlight.moment =
Highlight.mongoose =
Highlight.node =
Highlight.rethinkdb =
Highlight.sinon =
Highlight.underscore = rootNode => {
  Highlight.all(rootNode.getElementsByTagName('pre'), 'javascript');
};

Highlight.requirejs =
Highlight.socketio = rootNode => {
  const elements = rootNode.getElementsByTagName('pre');
  for (let i = 0; i < elements.length; ++i) {
    if (elements[i].textContent.match(/^\s*</)) {
      Highlight.one(elements[i], 'markup');
    } else {
      Highlight.one(elements[i], 'javascript');
    }
  }
};

module.exports = Highlight;

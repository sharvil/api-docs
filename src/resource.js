'use babel';

const File = require('atom').File;
const Fs = require('fs');
const Http = require('follow-redirects').http;
const Mkdirp = require('mkdirp');
const Path = require('path');
const Rmdir = require('rmdir');

class Resource {
  static BASE_URL_ = 'http://devdocs.io';
  static BASE_VERSION_URL_ = 'http://docs.devdocs.io';
  static BASE_PATH_ = Path.join(Path.dirname(atom.config.getUserConfigPath()), 'packages', 'api-docs', 'data');

  static collectGarbage(library) {
    Fs.readdir(Resource.BASE_PATH_, (err, files) => {
      if (err) {
        return;
      }

      for (let i = 0; i < files.length; ++i) {
        if (!Fs.lstatSync(Path.join(Resource.BASE_PATH_, files[i])).isDirectory()) {
          continue;
        }

        const ext = Path.extname(files[i]);
        const version = Number.parseInt(ext.substr(1));
        const id = Path.basename(files[i], ext);
        const docset = library.get(id);

        if (!docset || docset.version != version) {
          Rmdir(Path.join(Resource.BASE_PATH_, files[i]), () => null);
        }
      }
    });
  }

  static get(resourceName, opt_forceReload) {
    const url = Resource.BASE_URL_ + '/' + resourceName;
    const filename = Path.join(Resource.BASE_PATH_, resourceName);

    return Resource.get_(url, opt_forceReload ? '' : filename, filename);
  }

  static getVersion(resourceName, version) {
    const url = Resource.BASE_VERSION_URL_ + '/' + resourceName + '?' + version;

    // Insert the version number as an extension to the directory name containing
    // the given resource.
    const switcheroo = Path.join(Path.dirname(resourceName) + '.' + version.toString(), Path.basename(resourceName));
    const filename = Path.join(Resource.BASE_PATH_, switcheroo);

    return Resource.get_(url, filename, filename);
  }

  static get_(url, readFilename, writeFilename) {
    return new File(readFilename).read()
        .then(result => result ? result : Promise.reject('ReadFail'))
        .catch(error => {
          return new Promise((resolve, reject) => {
            Http.get(url, response => {
              response.on('error', reject);

              var buffer = '';
              response.on('data', chunk => { buffer += chunk; });
              response.on('end', () => { resolve(buffer); });
            }).on('error', reject);
          }).then(result => {
            Mkdirp(Path.dirname(writeFilename));
            new File(writeFilename).write(result);
            return result;
          }).catch(error => {
            return new File(writeFilename).read()
                .then(result => result ? result : Promise.reject('ReadFail'));
          });
        });
  }
}

module.exports = Resource;

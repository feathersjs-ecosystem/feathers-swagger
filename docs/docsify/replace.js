function install (hook) {
  let replacements;

  hook.mounted(function () {
    replacements = window.$docsify.replacements || [];
  });

  hook.beforeEach(function (content) {
    let modifiedContent = content;
    replacements.forEach(({ search, replace }) => {
      modifiedContent = modifiedContent.replace(search, replace);
    });
    return modifiedContent;
  });
}

window.$docsify.plugins = [].concat(install, window.$docsify.plugins);

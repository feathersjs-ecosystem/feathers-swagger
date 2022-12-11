function install (hook, vm) {
  const codeContainer = {
    counter: 0,
    codes: {}
  };

  hook.beforeEach(function (content) {
    codeContainer.counter = 0;
    codeContainer.codes = {};
    return content;
  });

  hook.mounted(function () {
    if (vm.compiler._marked.Renderer.prototype.code) {
      const original = vm.compiler._marked.defaults.renderer.code;

      const code = (code, infostring, escaped) => {
        const infostringParts = infostring.split(' ');
        let options;

        if (infostringParts.length > 1) {
          const [lang, ...rest] = infostringParts;
          infostring = lang;
          try {
            options = JSON.parse(rest.join(' '));
          } catch (e) {
            console.error('invalid code options');
          }
        }

        const originalResult = original(code, infostring, escaped);

        if (typeof options === 'object') {
          let { lineNumbers, highlight } = options;

          if (typeof lineNumbers === 'boolean') {
            lineNumbers = { enabled: lineNumbers };
          } else if (typeof lineNumbers === 'number') {
            lineNumbers = { enabled: true, start: lineNumbers };
          }

          const additionalAttributes = [];
          if (typeof lineNumbers === 'object') {
            if (lineNumbers.enabled) {
              additionalAttributes.push(`class="language-${infostring} line-numbers"`);
            }
            if (lineNumbers.start) {
              additionalAttributes.push(`data-start="${lineNumbers.start}"`);
            }
          }

          if (typeof highlight === 'string') {
            highlight = { line: highlight };
          }

          if (typeof highlight === 'object') {
            if (highlight.line) {
              additionalAttributes.push(`data-line="${highlight.line}"`);
            }
            if (highlight.lineOffset) {
              additionalAttributes.push(`data-line-offset="${highlight.lineOffset}"`);
            }
          }

          if (additionalAttributes.length) {
            codeContainer.codes[codeContainer.counter] = code;
            additionalAttributes.push(`data-code-counter="${codeContainer.counter}"`);
            codeContainer.counter += 1;

            return originalResult.replace(/^<pre /, `<pre ${additionalAttributes.join(' ')} `);
          }
        }

        return originalResult;
      };

      vm.compiler._marked.use({ renderer: { code } });
    }
  });

  hook.doneEach(function () {
    document.querySelector('#main').querySelectorAll('pre[data-code-counter]').forEach(pre => {
      const env = {
        code: codeContainer.codes[pre.dataset.codeCounter],
        element: pre.querySelector(':scope > code')
      };

      window.Prism.hooks.run('complete', env);
    });
  });
}

window.$docsify.plugins = [].concat(install, window.$docsify.plugins);

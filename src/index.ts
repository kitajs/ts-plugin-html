import tss from 'typescript/lib/tsserverlibrary';
import { proxyObject, recursiveDiagnoseJsxElements } from './util';

export = function initHtmlPlugin({ typescript: ts }: { typescript: typeof tss }) {
  return {
    create(info: tss.server.PluginCreateInfo) {
      const proxy = proxyObject(info.languageService);

      proxy.getSemanticDiagnostics = function clonedSemanticDiagnostics(filename) {
        const diagnostics = info.languageService.getSemanticDiagnostics(filename);

        // Not a tsx file, so don't do anything
        if (!filename.match(/(t|j)sx$/)) {
          return diagnostics;
        }

        const program = info.languageService.getProgram();
        const source = program?.getSourceFile(filename);

        if (!program || !source) {
          return diagnostics;
        }

        const typeChecker = program.getTypeChecker();

        ts.forEachChild(source, function loopSourceNodes(node) {
          recursiveDiagnoseJsxElements(node, typeChecker, diagnostics);
        });

        return diagnostics;
      };

      return proxy;
    }
  };
};

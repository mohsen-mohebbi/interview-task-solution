import { MissingTranslationHandler, MissingTranslationHandlerParams } from "@ngx-translate/core";

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    console.log(`Missing translation: ${params.key}`);
    return params.key; // or a placeholder
  }
}
declare module "@herp-inc/snabbdom-jsx" {
  namespace jsx {
    namespace JSX {
      interface IntrinsicElements {
        "c-counter": {
          $attrs?: { step: number };
        };
      }
    }
  }
}

export {};

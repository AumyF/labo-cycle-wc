import { makeDOMDriver } from "@cycle/dom";
import run, { type Sources } from "@cycle/run";
import { Stream } from "xstream";

const makeEventEmitDriver = <ET extends EventTarget>(target: ET) => {
  return (sink: Stream<null>) => {
    sink.addListener({
      next() {
        target.dispatchEvent(new Event("reach10", { bubbles: true }));
      },
    });
  };
};

class CCounter extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    const container = document.createElement("div");

    this.attachShadow({ mode: "open" }).appendChild(container);
    const step = Number(this.getAttribute("step") ?? 1);

    const drivers = {
      DOM: makeDOMDriver(container),
      EVENT: makeEventEmitDriver(this),
    };

    function counter(sources: Sources<typeof drivers>) {
      const increment$ = sources.DOM.select(".increment")
        .events("click")
        .mapTo(step);
      const action$ = increment$;
      const count$ = action$.fold((acc, x) => acc + x, 0);

      const emit$ = count$.filter((count) => count === 10).mapTo(null);

      const vdom$ = count$.map((count) => (
        <div>
          <button className="increment" type="button">
            +{step}
          </button>
          <div>{count}</div>
        </div>
      ));

      return {
        DOM: vdom$,
        EVENT: emit$,
      };
    }

    run(counter, drivers);
  }
}

customElements.define("c-counter", CCounter);

const drivers = {
  DOM: makeDOMDriver("#app"),
};

function main(sources: Sources<typeof drivers>) {
  const count$ = sources.DOM.select("c-counter")
    .events("reach10" as any)
    .mapTo(1)
    .fold((acc, x) => acc + x, 0);

  const vdom$ = count$.map((count) => (
    <div>
      <c-counter />
      <c-counter $attrs={{ step: 2 }} />
      <div id="counter3"></div>
      <p>{count} counter(s) reached 10!</p>
    </div>
  ));

  const sinks = {
    DOM: vdom$,
  };

  return sinks;
}

run(main, drivers);

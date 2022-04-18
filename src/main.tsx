import { makeDOMDriver } from "@cycle/dom";
import run, { Drivers, type Sources } from "@cycle/run";
import { Stream } from "xstream";

const makeEventEmitDriver = <ET extends EventTarget>(target: ET) => {
  return <Ev extends Event>(sink: Stream<Ev>) => {
    sink.addListener({
      next(event) {
        target.dispatchEvent(event);
      },
    });
    return sink.map((event) => target.dispatchEvent(event));
  };
};

type DOMDrivers = {
  DOM: ReturnType<typeof makeDOMDriver>;
  EVENT: ReturnType<typeof makeEventEmitDriver>;
};

function defineComponent<
  D extends Drivers,
  S extends { [K in keyof D & DOMDrivers]: Parameters<(D & DOMDrivers)[K]>[0] }
>(
  name: `${string}-${string}`,
  driversWithoutDOM: D,
  main: (sources: Sources<D & DOMDrivers>) => S,

  base: typeof HTMLElement = HTMLElement
) {
  customElements.define(
    name,
    class extends base {
      constructor() {
        super();
      }
      connectedCallback() {
        const drivers = {
          ...driversWithoutDOM,
          DOM: makeDOMDriver(this),
          EVENT: makeEventEmitDriver(this),
        };

        run(main, drivers);
      }
    }
  );
}

defineComponent("x-counter", {}, (sources) => {
  const increment$ = sources.DOM.select(".increment").events("click").mapTo(1);
  const action$ = increment$;
  const count$ = action$.fold((acc, x) => acc + x, 0);

  const emit$ = count$
    .filter((count) => count === 10)
    .mapTo(new Event("reach10", { bubbles: true }));
  const vdom$ = count$.map((count) => (
    <div>
      <button className="increment" type="button">
        +1
      </button>
      <div>{count}</div>
    </div>
  ));

  return {
    DOM: vdom$,
    EVENT: emit$,
  };
});

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

      const emit$ = count$
        .filter((count) => count === 10)
        .mapTo(new Event("reach10", { bubbles: true }));

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

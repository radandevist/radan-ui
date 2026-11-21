/** The view-transition guard: the CSS attributes of `beginPageTransition` live exactly as long as the transition. */

type StartArg = Parameters<Document['startViewTransition']>[0];
/** What the router reads from a started transition, and what the guard needs of a document. */
type Settleable = Pick<ViewTransition, 'finished' | 'updateCallbackDone'>;
type GuardedDocument = {
	documentElement: { dataset: DOMStringMap };
	startViewTransition: (arg: StartArg) => Settleable;
};

export const clearAttributes = (doc: Pick<GuardedDocument, 'documentElement'>) => {
	delete doc.documentElement.dataset.pageTransition;
	delete doc.documentElement.dataset.pageDirection;
};

/** The newest view transition still running: its settle handler owns the attributes' cleanup. */
let inFlight: Settleable | undefined;
/** Whether a guarded view transition is still running. */
export const viewTransitionRunning = () => inFlight !== undefined;

/**
 * Wraps `startViewTransition` once: the attributes the CSS reads are removed when the transition settles (finished,
 * skipped or aborted) unless a newer one has taken over, and a throw falls back to a plain update.
 */
export const guardViewTransitions = (doc: GuardedDocument) => {
	const original = doc.startViewTransition.bind(doc);
	doc.startViewTransition = (arg) => {
		try {
			const transition = original(arg);
			inFlight = transition;
			const settled = () => {
				if (inFlight === transition) {
					inFlight = undefined;
					clearAttributes(doc);
				}
			};
			transition.finished.then(settled, settled);
			return transition;
		} catch {
			clearAttributes(doc);
			const update = arg instanceof Function ? arg : arg?.update;
			const done = Promise.resolve().then(() => update?.());
			return { updateCallbackDone: done, finished: done };
		}
	};
};

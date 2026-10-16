/**
 * The info overlay lives in the home page grid, but on small screens it is
 * opened from the name in the top bar (a separate component). These two
 * window events connect them without a shared context provider.
 */

/** Fired by the top bar to open / close the overlay. */
export const INFO_TOGGLE_EVENT = "portfolio:info-toggle";

/** Fired by the grid whenever the overlay opens or closes (detail: boolean). */
export const INFO_STATE_EVENT = "portfolio:info-state";

/**
 * Film grain and an extremely soft vignette over the whole page (Phase 5).
 * Pure CSS (globals.css `.film`); see the note there for why this is a DOM
 * layer and not a WebGL post-processing pass.
 */
export function FilmGrain() {
  return (
    <div className="film" aria-hidden="true">
      <div className="film__vignette" />
      <div className="film__grain" />
    </div>
  );
}

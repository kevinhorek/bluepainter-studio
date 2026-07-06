export function isFacilitatorMode() {
  try {
    return new URLSearchParams(window.location.search).get('facilitator') === '1';
  } catch {
    return false;
  }
}

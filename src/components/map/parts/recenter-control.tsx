import { useMap } from 'react-map-gl/maplibre';
import { Crosshair } from 'lucide-react';
import { useCommonStore } from '@/stores/common-store';
import { useDirectionsStore } from '@/stores/directions-store';
import { CustomControl, ControlButton } from '../custom-control';

export function RecenterControl() {
  // Check if a route exists. successful turns false when user resets waypoints.
  const hasRoute = useDirectionsStore((state) => state.successful);

  // useMap has to be called here, before the early return below.
  const { current: map } = useMap();

  // This hides the button when no route is present.
  if (!hasRoute) return null;

  const handleRecenter = () => {
    if (!map) return;
    // Read latest store values at click time instead of using stale closures.
    const state = useCommonStore.getState();
    const { coordinates } = state;
    const dpOpen = state.directionsPanelOpen;
    const spOpen = state.settingsPanelOpen;

    if (!coordinates || coordinates.length === 0) return;

    const firstCoord = coordinates[0];
    if (!firstCoord || !firstCoord[0] || !firstCoord[1]) return;

    // Walk every route point and grow a bounding box around all of them.
    const bounds: [[number, number], [number, number]] = coordinates.reduce<
      [[number, number], [number, number]]
    >(
      (acc, coord) => {
        if (!coord || !coord[0] || !coord[1]) return acc;
        return [
          [Math.min(acc[0][0], coord[1]), Math.min(acc[0][1], coord[0])],
          [Math.max(acc[1][0], coord[1]), Math.max(acc[1][1], coord[0])],
        ];
      },
      [
        [firstCoord[1], firstCoord[0]],
        [firstCoord[1], firstCoord[0]],
      ]
    );

    const paddingTopLeft = [screen.width < 550 ? 50 : dpOpen ? 420 : 50, 50];
    const paddingBottomRight = [
      screen.width < 550 ? 50 : spOpen ? 420 : 50,
      50,
    ];

    map.fitBounds(bounds, {
      padding: {
        top: paddingTopLeft[1] as number,
        bottom: paddingBottomRight[1] as number,
        left: paddingTopLeft[0] as number,
        right: paddingBottomRight[0] as number,
      },
      maxZoom: coordinates.length === 1 ? 11 : 18,
      duration: 800,
    });
  };

  // Render inside the MapLibre top-right control group so it sits with the zoom buttons.
  return (
    <CustomControl position="topRight">
      <ControlButton
        title="Recenter to route"
        icon={<Crosshair size={15} />}
        onClick={handleRecenter}
        data-testid="recenter-button"
      />
    </CustomControl>
  );
}

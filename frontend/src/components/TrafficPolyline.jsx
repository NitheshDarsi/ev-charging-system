import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { getRouteSegments } from '../utils/trafficEngine';

export default function TrafficPolyline({ positions, weight = 6, opacity = 0.9 }) {
  const segments = useMemo(() => {
    return getRouteSegments(positions);
  }, [positions]);

  if (!segments.length) return null;

  return (
    <>
      <Polyline positions={positions} pathOptions={{ color: '#0f172a', weight: weight + 3, opacity: 0.25, lineCap: "round", lineJoin: "round" }} />
      {segments.map((seg, i) => (
        <Polyline 
          key={i}
          positions={seg.positions}
          pathOptions={{ color: seg.color, weight, opacity, lineCap: "round", lineJoin: "round" }}
        />
      ))}
    </>
  );
}

import { useEegBuffer } from "./useEegBuffer";

export default function BrainWaveCanvas({
  emphasis,
  renderState,
}) {
  const canvasRef = useEegBuffer({
    emphasis,
    renderState,
  });

  return <canvas className="sl-wave-box__canvas" ref={canvasRef} />;
}

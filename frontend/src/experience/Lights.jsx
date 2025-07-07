export default function Lights() {
  return (
    <>
      {/* Lumière d’ambiance réduite pour des ombres plus marquées */}
      <ambientLight intensity={0.3} />

      {/* DirectionalLight “soleil” pour créer des ombres nettes */}
      <directionalLight
        color="#ffffff"
        intensity={1.8}
        position={[5, 10, 5]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Spot lumineux au-dessus pour souligner les pièces */}
      <spotLight
        color="#ffffff"
        intensity={6}
        position={[0, 12, 0]}
        angle={Math.PI / 8}
        penumbra={0.5}
        decay={2}
        distance={30}
        castShadow
      />
    </>
  )
}

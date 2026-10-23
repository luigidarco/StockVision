export default function LoginArtwork() {
  const facets = (
    <>
      <polygon points="28,36 92,8 155,30 175,68 112,174 10,72" fill="#a7dce4" />
      <path d="M28 36 10 72 58 81 92 8 111 64 155 30 175 68 111 64 112 174 58 81 28 36 111 64 175 68 M10 72 112 174 M155 30 112 174" fill="none" stroke="#4b83a6" strokeWidth="1.2" />
      <polygon points="28,36 58,81 10,72" fill="#7bc8d7" />
      <polygon points="155,30 175,68 111,64" fill="#88cedb" stroke="#4b83a6" strokeWidth="1.2" />
    </>
  );

  return (
    <div className="login-artwork" aria-hidden="true">
      {["small", "top", "bottom"].map((position) => (
        <svg key={position} className={`login-gem login-gem-${position}`} viewBox="0 0 190 190">
          {facets}
        </svg>
      ))}
    </div>
  );
}

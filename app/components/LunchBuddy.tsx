type LunchBuddyProps = {
  message?: string;
  compact?: boolean;
};

export function LunchBuddy({ message = "Finding something good…", compact = false }: LunchBuddyProps) {
  return (
    <div className={`lunch-buddy ${compact ? "compact" : ""}`} aria-label={message}>
      <div className="buddy-character" aria-hidden="true">
        <span className="buddy-handle" />
        <span className="buddy-eye buddy-eye-left" />
        <span className="buddy-eye buddy-eye-right" />
        <span className="buddy-smile" />
        <span className="buddy-cheek buddy-cheek-left" />
        <span className="buddy-cheek buddy-cheek-right" />
        <span className="buddy-spark">✦</span>
      </div>
      <div className="buddy-copy">
        <b>Lunchie</b>
        <span>{message}</span>
      </div>
    </div>
  );
}

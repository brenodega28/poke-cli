/** Per-game offsets. All Gen 4 saves are 512 KiB with two save slots. */
export interface Gen4Game {
  readonly name: "DP" | "Pt" | "HGSS";
  readonly generalSize: number;
  /** Offset of party slot 0 within the general block. Count lives at -4. */
  readonly partyOffset: number;
  /** Offset of the storage block within a partition (not always contiguous). */
  readonly storageBase: number;
  readonly storageSize: number;
  /** Trailing footer bytes excluded from the block CRC (HGSS uses 0x10, others 0x14). */
  readonly storageFooterSize: number;
  /** Offset of box slot 0 within the storage block. */
  readonly boxOffset: number;
  /** Bytes between consecutive boxes (HGSS pads each box past its 30 slots). */
  readonly boxStride: number;
}

export interface Gen4ParserOptions {
  /** Force a game variant instead of detecting it from the footer. */
  game?: Gen4Game["name"];
  /** Force a save slot (0 or 1) instead of picking the live one. */
  slot?: 0 | 1;
}
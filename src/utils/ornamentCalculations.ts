export interface OrnamentValuation {
  net: number;
  totalBuyingValue: number;
  currentGoldValueLive: number;
  marketValue: number;
  appreciation: number;
  appreciationPct: number;
}

// Market value trends above the live 22K rate; the 1.0677 multiplier and the
// 205000/29.31 fallbacks reproduce the figures used across the ornament forms
// and detail screens when a live rate isn't available yet.
export function calculateOrnamentValuation(
  grossWeight: number,
  stoneWeight: number,
  buyingPricePerGram: number,
  liveRate22k: number
): OrnamentValuation {
  const net = Math.max(0, grossWeight - stoneWeight);
  const totalBuyingValue = Math.round(net * buyingPricePerGram);
  const currentGoldValueLive = Math.round(net * liveRate22k);
  const marketValue = Math.round(net * (liveRate22k > 0 ? liveRate22k * 1.0677 : 205000));
  const appreciation = marketValue - totalBuyingValue;
  const appreciationPct = totalBuyingValue > 0 ? (appreciation / totalBuyingValue) * 100 : 29.31;

  return { net, totalBuyingValue, currentGoldValueLive, marketValue, appreciation, appreciationPct };
}

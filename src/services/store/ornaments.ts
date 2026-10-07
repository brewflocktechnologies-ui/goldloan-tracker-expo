import { Ornament } from '../../types';
import { calculateOrnamentFigures } from '../../utils/userOrnamentCalculations';
import { api } from '../api';
import { normalizeOrnament } from '../normalize';
import { nextId, replaceItem, restoreItem, runMutation, SaveCallbacks } from './mutation';
import { persistAll } from './persist';
import { notify, state } from './state';

export function createOrnamentActions() {
  const addOrnament = (ornData: Partial<Ornament> & { files?: any[] }, callbacks?: SaveCallbacks) => {
    const tempId = nextId('ORN', state.ornaments, 'OrnamentId');
    const { gross, stone, metal, net, buyingPrice, currentPrice, buyingCost, marketValue, appreciationValue, appreciationPercentage } =
      calculateOrnamentFigures(ornData);

    const newOrn: Ornament = {
      OrnamentId: tempId,
      UserId: ornData.UserId || state.users[0]?.UserId || 'U001',
      OrnamentName: ornData.OrnamentName || 'Gold Item',
      OrnamentType: ornData.OrnamentType || 'Necklace',
      OrnamentCategory: ornData.OrnamentCategory || 'Neckwear',
      Description: ornData.Description || '',
      GrossWeight: gross,
      StoneWeight: stone,
      NetWeight: net,
      MetalWeight: metal,
      Purity: ornData.Purity || '22K',
      HallmarkNumber: ornData.HallmarkNumber || '',
      Quantity: Number(ornData.Quantity) || 1,
      BuyingPricePerGram: buyingPrice,
      CurrentPricePerGram: currentPrice,
      BuyingCost: buyingCost,
      TotalPrice: buyingCost,
      MarketValue: marketValue,
      AppreciationValue: appreciationValue,
      AppreciationPercentage: appreciationPercentage,
      MakerName: ornData.MakerName || '',
      EstimatedValue: Number(ornData.EstimatedValue) || marketValue,
      OrnamentImages: ornData.OrnamentImages || '',
      Remarks: ornData.Remarks || '',
      Status: (ornData.Status as any) || 'Available',
    };
    const prevIds = new Set(state.ornaments.map(o => o.OrnamentId));
    state.ornaments = [newOrn, ...state.ornaments];
    persistAll();
    notify();

    runMutation<Ornament>(() => api.addOrnament(ornData), {
      callbacks,
      failureMessage: `Ornament "${newOrn.OrnamentName}" was not saved`,
      onSaved: data => {
        state.ornaments = state.ornaments.map(o => o.OrnamentId === tempId ? { ...o, ...normalizeOrnament(data) } : o);
        persistAll();
        notify();
      },
      undo: () => { state.ornaments = state.ornaments.filter(o => o.OrnamentId !== tempId); },
      alwaysUndo: true,
      findSaved: () => state.ornaments.find(o =>
        !prevIds.has(o.OrnamentId) && o.UserId === newOrn.UserId && o.OrnamentName === newOrn.OrnamentName),
    });

    return newOrn;
  };

  const updateOrnament = (ornId: string, updated: Partial<Ornament> & { files?: any[] }, callbacks?: SaveCallbacks) => {
    const prev = state.ornaments.find(o => o.OrnamentId === ornId);
    state.ornaments = state.ornaments.map(o => {
      if (o.OrnamentId === ornId) {
        const merged = { ...o, ...updated };
        const { gross, stone, metal, net, buyingCost, marketValue, appreciationValue: apprVal, appreciationPercentage: apprPct } =
          calculateOrnamentFigures(merged);

        return {
          ...merged,
          GrossWeight: gross,
          StoneWeight: stone,
          NetWeight: net,
          MetalWeight: metal,
          BuyingCost: buyingCost,
          TotalPrice: buyingCost,
          MarketValue: marketValue,
          AppreciationValue: apprVal,
          AppreciationPercentage: apprPct,
        };
      }
      return o;
    });
    persistAll();
    notify();

    runMutation(() => api.updateOrnament(ornId, updated), {
      callbacks,
      failureMessage: `Changes to ${prev?.OrnamentName || ornId} were not saved`,
      undo: () => { state.ornaments = replaceItem(state.ornaments, prev, 'OrnamentId'); },
    });
  };

  const deleteOrnament = (ornId: string, callbacks?: SaveCallbacks) => {
    const index = state.ornaments.findIndex(o => o.OrnamentId === ornId);
    const prev = state.ornaments[index];
    state.ornaments = state.ornaments.filter(o => o.OrnamentId !== ornId);
    persistAll();
    notify();

    runMutation(() => api.deleteOrnament(ornId), {
      callbacks,
      failureMessage: `${prev?.OrnamentName || ornId} was not deleted`,
      undo: () => { state.ornaments = restoreItem(state.ornaments, prev, 'OrnamentId', index); },
    });
  };

  return { addOrnament, updateOrnament, deleteOrnament };
}

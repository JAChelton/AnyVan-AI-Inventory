// src/utils/formatters.ts - ADD this new file

export const formatVolume = (volume: number): string => {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)} m³`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)} L`;
  }
  return `${volume.toLocaleString()} cm³`;
};

export const formatWeight = (weight: number): string => {
  return `${weight.toLocaleString()} kg`;
};

export const formatDimensions = (height: number, width: number, depth: number): string => {
  return `${height}×${width}×${depth} cm`;
};

export const capitalizeWords = (text: string): string => {
  return text.replace(/\b\w/g, char => char.toUpperCase());
};
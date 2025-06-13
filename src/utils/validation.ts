export const validateItemText = (text: string): boolean => {
  return typeof text === 'string' && 
         text.trim().length > 0 && 
         text.trim().length < 100;
};

export const validateWeight = (weight: number): boolean => {
  return typeof weight === 'number' && 
         weight > 0 && 
         weight < 10000 && 
         !isNaN(weight);
};

export const validateDimensions = (height: number, width: number, depth: number): boolean => {
  return [height, width, depth].every(dim => 
    typeof dim === 'number' && 
    dim > 0 && 
    dim < 1000 && 
    !isNaN(dim)
  );
};
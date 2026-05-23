export function generateCode (predix: string, number: number, length = 4){
    return `${predix}_${String(number).padStart(length, '0')}`;
}
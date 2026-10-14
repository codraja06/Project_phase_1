export interface MapPin { id: string; latitude: number; longitude: number; title?: string; address?: string }
export interface MapSurfaceProps {
  latitude: number; longitude: number; interactive?: boolean;
  pins?: MapPin[]; onSelectPin?: (id: string) => void;
  onSelectLocation?: (latitude: number, longitude: number) => void;
}

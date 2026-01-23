import { useEffect, useState, useRef, type MutableRefObject } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Tooltip } from "react-leaflet";
import { LatLng, Icon } from "leaflet";
import { Button } from "@/components/ui/button";
import { Undo2, Save, Trash2, Ruler, Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// Custom marker icon hack for Leaflet in React
// In a real production app, import these properly
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const defaultIcon = new Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const editIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  className: 'leaflet-edit-marker'
});


// Component to handle map clicks
function MapEvents({ onMapClick }: { onMapClick: (e: any) => void }) {
  useMapEvents({
    click: onMapClick,
  });
  return null;
}

// Address search component (outside map context)
function AddressSearchInput({ initialValue, onAddressFound }: { initialValue?: string; onAddressFound: (lat: number, lng: number) => void; }) {
  const [address, setAddress] = useState(initialValue || "");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialValue) {
      setAddress(initialValue);
    }
  }, [initialValue]);

  const handleSearch = async (searchAddress: string) => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      );
      const results = await response.json();
      
      if (results.length > 0) {
        const { lat, lon } = results[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        
        onAddressFound(newLat, newLng);
        // Do not clear address on successful auto-search
        // setAddress(""); 
      } else {
        toast({
          title: "Address not found",
          description: "The provided address could not be located. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching for the address.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const onManualSearch = () => {
    handleSearch(address);
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Enter property address..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onManualSearch()}
        disabled={isSearching}
        className="text-sm"
      />
      <Button
        size="icon"
        onClick={onManualSearch}
        disabled={isSearching || !address.trim()}
        variant="outline"
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

interface Point {
  lat: number;
  lng: number;
  id: string;
}

interface ExistingLine {
  id: number;
  coordinates: { lat: number; lng: number }[];
}

interface MapEditorProps {
  initialCenter?: [number, number];
  initialAddress?: string;
  onSave: (points: Point[], material: string, height: number, length: number) => void;
  isSaving: boolean;
  existingLines?: ExistingLine[];
  isMobile?: boolean;
  selectedLineId?: number | null;
  onLineSelect?: (id: number | null) => void;
  editingLine?: any | null;
  onLineUpdate?: (line: any) => void;
}

export function MapEditorComponent({ 
  initialCenter = [34.0522, -118.2437], 
  initialAddress, 
  onSave, 
  isSaving, 
  existingLines = [], 
  isMobile,
  selectedLineId = null,
  onLineSelect = () => {},
  editingLine = null,
  onLineUpdate = () => {}
}: MapEditorProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [material, setMaterial] = useState("wood_cedar");
  const [height, setHeight] = useState("6");
  const [totalDistance, setTotalDistance] = useState(0);
  const mapRef = useRef<any>(null);

  // Calculate distance when points change
  useEffect(() => {
    if (points.length < 2) {
      setTotalDistance(0);
      return;
    }

    let dist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = new LatLng(points[i].lat, points[i].lng);
      const p2 = new LatLng(points[i + 1].lat, points[i + 1].lng);
      dist += p1.distanceTo(p2); // meters
    }
    // Convert meters to feet
    setTotalDistance(dist * 3.28084);
  }, [points]);

  const handleMapClick = (e: any) => {
    const newPoint: Point = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      id: Math.random().toString(36).substr(2, 9),
    };
    setPoints([...points, newPoint]);
  };

  const handleUndo = () => {
    setPoints(points.slice(0, -1));
  };

  const handleClear = () => {
    setPoints([]);
  };

  const handleSave = () => {
    if (points.length < 2) return;
    // Recalculate distance at save time to ensure accuracy
    let calculatedDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = new LatLng(points[i].lat, points[i].lng);
      const p2 = new LatLng(points[i + 1].lat, points[i + 1].lng);
      calculatedDist += p1.distanceTo(p2); // meters
    }
    const distanceInFeet = calculatedDist * 3.28084;
    onSave(points, material, parseFloat(height), distanceInFeet);
    setPoints([]); // Clear after save (or keep based on UX preference)
  };

  const handleAddressFound = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 20);
    }
  };

  const DesktopContent = () => (
    <div className="space-y-4">
      <div className="space-y-2 pb-3 border-b">
        <Label className="text-xs">Search Address</Label>
        <AddressSearchInput initialValue={initialAddress} onAddressFound={handleAddressFound} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Material</Label>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wood_pine">Wood: Pine</SelectItem>
              <SelectItem value="wood_cedar">Wood: Cedar</SelectItem>
              <SelectItem value="vinyl">Vinyl</SelectItem>
              <SelectItem value="iron">Iron</SelectItem>
            </SelectContent>
          </Select>
        </div>            
        <div className="space-y-2">
          <Label className="text-xs">Height (ft)</Label>
          <Select value={height} onValueChange={setHeight}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 ft</SelectItem>
              <SelectItem value="6">6 ft</SelectItem>
              <SelectItem value="8">8 ft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-secondary/50 rounded-lg p-3 text-center border border-border/50">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Length</span>
        <div className="text-2xl font-mono font-bold text-foreground">
          {totalDistance.toFixed(1)} <span className="text-base text-muted-foreground">ft</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleUndo} 
          disabled={points.length === 0}
          title="Undo last point"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleClear} 
          disabled={points.length === 0}
          className="text-destructive hover:text-destructive"
          title="Clear all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button 
          className="flex-1 gap-2 bg-primary hover:bg-primary/90" 
          onClick={handleSave}
          disabled={points.length < 2 || isSaving}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Line"}
        </Button>
      </div>
    </div>
  );
  
  const MobileContent = () => (
    <div className="space-y-2">
      <div className="space-y-2">
        <Label className="text-xs px-4">Search Address</Label>
        <div className="px-4">
          <AddressSearchInput initialValue={initialAddress} onAddressFound={handleAddressFound} />
        </div>
      </div>
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="px-4 text-sm">Fence Details</AccordionTrigger>
          <AccordionContent className="px-4">
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Material</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wood_pine">Wood: Pine</SelectItem>
                    <SelectItem value="wood_cedar">Wood: Cedar</SelectItem>
                    <SelectItem value="vinyl">Vinyl</SelectItem>
                    <SelectItem value="iron">Iron</SelectItem>
                  </SelectContent>
                </Select>
              </div>            
              <div className="space-y-2">
                <Label className="text-xs">Height (ft)</Label>
                <Select value={height} onValueChange={setHeight}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 ft</SelectItem>
                    <SelectItem value="6">6 ft</SelectItem>
                    <SelectItem value="8">8 ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="border-b-0">
          <AccordionTrigger className="px-4 text-sm">
            <div className="flex-1 flex justify-between items-center">
              <span>Total Length</span>
              <span className="text-lg font-mono font-bold text-foreground mr-2">
                {totalDistance.toFixed(1)}
                <span className="text-sm text-muted-foreground ml-1">ft</span>
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <p className="text-xs text-muted-foreground pt-2">
              This is the calculated length of the fence line based on the points placed on the map.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="flex gap-2 px-4 pb-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleUndo} 
          disabled={points.length === 0}
          title="Undo last point"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleClear} 
          disabled={points.length === 0}
          className="text-destructive hover:text-destructive"
          title="Clear all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button 
          className="flex-1 gap-2 bg-primary hover:bg-primary/90" 
          onClick={handleSave}
          disabled={points.length < 2 || isSaving}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Line"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border shadow-inner">
      <MapContainer
        ref={mapRef}
        center={initialCenter}
        zoom={21}
        maxZoom={22}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={23}
          maxNativeZoom={19}
        />
        <style>{`
          .leaflet-edit-marker {
            filter: hue-rotate(120deg);
          }
        `}</style>
        <MapEvents onMapClick={handleMapClick} />

        {/* Render existing lines */}
        {existingLines.map(line => (
          <Polyline
            key={line.id}
            positions={line.coordinates.map(c => [c.lat, c.lng])}
            pathOptions={{ 
              color: selectedLineId === line.id && !editingLine ? 'red' : 'blue', 
              weight: selectedLineId === line.id && !editingLine ? 5 : 3 
            }}
            eventHandlers={{
              click: () => {
                if (!editingLine) {
                  onLineSelect?.(selectedLineId === line.id ? null : line.id);
                }
              },
            }}
          />
        ))}

        {editingLine && (
          <>
            <Polyline
              positions={editingLine.coordinates.map((c: any) => [c.lat, c.lng])}
              pathOptions={{ color: 'orange', weight: 5 }}
            />
            {editingLine.coordinates.map((coord: any, index: number) => (
              <Marker
                key={coord.id || index}
                position={[coord.lat, coord.lng]}
                draggable={true}
                icon={editIcon}
                eventHandlers={{
                  dragend: (e) => {
                    const newCoords = [...editingLine.coordinates];
                    const target = e.target.getLatLng();
                    newCoords[index] = { ...newCoords[index], lat: target.lat, lng: target.lng };
                    onLineUpdate({ ...editingLine, coordinates: newCoords });
                  },
                }}
              />
            ))}
          </>
        )}

        {points.map((point, idx) => (
          <Marker 
            key={point.id} 
            position={[point.lat, point.lng]} 
            icon={defaultIcon}
          >
            <Tooltip permanent direction="top" offset={[0, -20]} className="bg-transparent border-none shadow-none font-bold text-primary">
              {idx + 1}
            </Tooltip>
          </Marker>
        ))}

        {points.length > 1 && (
          <Polyline 
            positions={points.map(p => [p.lat, p.lng])} 
            pathOptions={{ color: 'var(--primary)', weight: 4, opacity: 0.8, dashArray: '10, 10' }} 
          />
        )}
      </MapContainer>

      {/* Floating Controls */}
      {!editingLine && (
        <Card className={cn(
          "absolute top-4 z-40 bg-background/95 backdrop-blur shadow-xl border-border/50",
          isMobile ? "left-4 right-4 w-auto" : "right-4 w-72 p-4"
        )}>
          <h3 className={cn(
            "font-display font-bold text-lg flex items-center gap-2",
            isMobile ? "mb-0 p-4" : "mb-4"
          )}>
            <Ruler className="w-5 h-5 text-primary" />
            New Fence Line
          </h3>
          
          {isMobile ? <MobileContent /> : <DesktopContent />}
        </Card>
      )}
      
      <div className="absolute bottom-4 left-4 z-40 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm">
        {editingLine ? "Drag points to edit the line" : "Click on map to place fence posts"}
      </div>
    </div>
  );
}
import {useState, useEffect} from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
} from "@chakra-ui/react";
import {getHotels, Hotel} from "@/services/hotels";

interface GroupContractData {
  groupName: string;
  startDate: string;
  endDate: string;
  hotelId: string;
  bookingType: string;
}

export default function GroupContractForm({
                                            initialData,
                                            onNext,
                                            onCancel,
                                          }: {
  initialData?: Partial<GroupContractData>;
  onNext: (data: GroupContractData) => void;
  onCancel: () => void;
}) {
  const [groupName, setGroupName] = useState(initialData?.groupName || "");
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [hotelId, setHotelId] = useState(initialData?.hotelId || "");
  const [bookingType, setBookingType] = useState(initialData?.bookingType || "");

  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    const hotelsData = await getHotels();
    setHotels(hotelsData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !startDate || !endDate || !hotelId || !bookingType) {
      alert("Please fill in all required fields.");
      return;
    }
    onNext({
      groupName,
      startDate,
      endDate,
      hotelId,
      bookingType,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Group Name</FormLabel>
          <Input value={groupName} onChange={(e) => setGroupName(e.target.value)}/>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Start Date</FormLabel>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>End Date</FormLabel>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Hotel</FormLabel>
          <Select value={hotelId} onChange={(e) => setHotelId(e.target.value)}>
            <option value="">Select a hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Booking Type</FormLabel>
          <Select value={bookingType} onChange={(e) => setBookingType(e.target.value)}>
            <option value="">Select booking type</option>
            <option value="tourOperator">Tour Operator</option>
            <option value="diveShop">Dive Shop</option>
          </Select>
        </FormControl>
        <VStack spacing={2} align="stretch">
          <Button type="submit" colorScheme="teal">
            Next
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </VStack>
      </VStack>
    </form>
  );
}

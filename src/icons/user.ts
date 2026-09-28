import Add from '@/assets/user-icons/add.svg';
import ArrowLeftLong from '@/assets/user-icons/arrow-left-long.svg';
import ArrowRight from '@/assets/user-icons/arrow-right.svg';
import Bank from '@/assets/user-icons/bank.svg';
import Briefcase from '@/assets/user-icons/briefcase.svg';
import Calendar1 from '@/assets/user-icons/calendar-1.svg';
import Calendar from '@/assets/user-icons/calendar.svg';
import Camera from '@/assets/user-icons/camera.svg';
import CirclePercentage from '@/assets/user-icons/circle-percentage.svg';
import City from '@/assets/user-icons/city.svg';
import CreditCard from '@/assets/user-icons/credit-card.svg';
import Eye from '@/assets/user-icons/eye.svg';
import Filter from '@/assets/user-icons/filter.svg';
import IdCard from '@/assets/user-icons/id-card.svg';
import ImageAdd from '@/assets/user-icons/image-add.svg';
import Image from '@/assets/user-icons/image.svg';
import Location from '@/assets/user-icons/location.svg';
import Mail from '@/assets/user-icons/mail.svg';
import MapPin from '@/assets/user-icons/map-pin.svg';
import Map from '@/assets/user-icons/map.svg';
import Notebook from '@/assets/user-icons/notebook.svg';
import Phone from '@/assets/user-icons/phone.svg';
import RadioButton from '@/assets/user-icons/radio-button.svg';
import RupeeCircle from '@/assets/user-icons/rupee-circle.svg';
import Search from '@/assets/user-icons/search.svg';
import ShieldCheck from '@/assets/user-icons/shield-check.svg';
import Tick01 from '@/assets/user-icons/tick-01.svg';
import Time from '@/assets/user-icons/time.svg';
import User from '@/assets/user-icons/user.svg';
import Weight from '@/assets/user-icons/weight.svg';
import Whatsapp from '@/assets/user-icons/whatsapp.svg';

export const userIcons = {
  add: Add,
  'arrow-left-long': ArrowLeftLong,
  'arrow-right': ArrowRight,
  bank: Bank,
  briefcase: Briefcase,
  'calendar-1': Calendar1,
  calendar: Calendar,
  camera: Camera,
  'circle-percentage': CirclePercentage,
  city: City,
  'credit-card': CreditCard,
  eye: Eye,
  filter: Filter,
  'id-card': IdCard,
  'image-add': ImageAdd,
  image: Image,
  location: Location,
  mail: Mail,
  'map-pin': MapPin,
  map: Map,
  notebook: Notebook,
  phone: Phone,
  'radio-button': RadioButton,
  'rupee-circle': RupeeCircle,
  search: Search,
  'shield-check': ShieldCheck,
  'tick-01': Tick01,
  time: Time,
  user: User,
  weight: Weight,
  whatsapp: Whatsapp,
} as const;

export type UserIconName = keyof typeof userIcons;

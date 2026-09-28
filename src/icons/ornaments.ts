import Add from '@/assets/ornaments-icons/add.svg';
import ArrowDownS from '@/assets/ornaments-icons/arrow-down-s.svg';
import ArrowLeftLong from '@/assets/ornaments-icons/arrow-left-long.svg';
import ArrowLeftS from '@/assets/ornaments-icons/arrow-left-s.svg';
import Bank from '@/assets/ornaments-icons/bank.svg';
import BarChart2 from '@/assets/ornaments-icons/bar-chart-2.svg';
import Camera from '@/assets/ornaments-icons/camera.svg';
import Copy from '@/assets/ornaments-icons/copy.svg';
import DiamondRing from '@/assets/ornaments-icons/diamond-ring.svg';
import Filter3 from '@/assets/ornaments-icons/filter-3.svg';
import HomeSmile from '@/assets/ornaments-icons/home-smile.svg';
import Image from '@/assets/ornaments-icons/image.svg';
import Information from '@/assets/ornaments-icons/information.svg';
import Lock from '@/assets/ornaments-icons/lock.svg';
import Menu from '@/assets/ornaments-icons/menu.svg';
import Moneybag from '@/assets/ornaments-icons/moneybag.svg';
import More from '@/assets/ornaments-icons/more.svg';
import Notes from '@/assets/ornaments-icons/notes.svg';
import Quiz03 from '@/assets/ornaments-icons/quiz-03.svg';
import RupeeCircle from '@/assets/ornaments-icons/rupee-circle.svg';
import Search from '@/assets/ornaments-icons/search.svg';
import ShieldCheck from '@/assets/ornaments-icons/shield-check.svg';
import Star from '@/assets/ornaments-icons/star.svg';
import Tag from '@/assets/ornaments-icons/tag.svg';
import Tick01 from '@/assets/ornaments-icons/tick-01.svg';
import UsersGroup from '@/assets/ornaments-icons/users-group.svg';
import Weight from '@/assets/ornaments-icons/weight.svg';

export const ornamentsIcons = {
  add: Add,
  'arrow-down-s': ArrowDownS,
  'arrow-left-long': ArrowLeftLong,
  'arrow-left-s': ArrowLeftS,
  bank: Bank,
  'bar-chart-2': BarChart2,
  camera: Camera,
  copy: Copy,
  'diamond-ring': DiamondRing,
  'filter-3': Filter3,
  'home-smile': HomeSmile,
  image: Image,
  information: Information,
  lock: Lock,
  menu: Menu,
  moneybag: Moneybag,
  more: More,
  notes: Notes,
  'quiz-03': Quiz03,
  'rupee-circle': RupeeCircle,
  search: Search,
  'shield-check': ShieldCheck,
  star: Star,
  tag: Tag,
  'tick-01': Tick01,
  'users-group': UsersGroup,
  weight: Weight,
} as const;

export type OrnamentsIconName = keyof typeof ornamentsIcons;

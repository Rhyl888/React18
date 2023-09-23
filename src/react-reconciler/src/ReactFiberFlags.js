export const NoFlags = 0b00000000000000000000000000; //0
export const Placement = 0b00000000000000000000000010; //2
export const Update = 0b00000000000000000000000100; //4
export const ChildDeletion = 0b00000000000000000000001000; //有子节点需要被删除
export const MutationMask = Placement | Update | ChildDeletion;
//如果函数组件使用了useEffect 则里面包含这个1024
export const Passive = 0b00000000000000010000000000; //1024

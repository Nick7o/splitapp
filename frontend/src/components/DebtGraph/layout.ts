export interface LayoutMember {
  id: string;
}

export interface LayoutDebt {
  fromUserId: string;
  toUserId: string;
}

export interface LayoutSize {
  width: number;
  height: number;
}

export interface GraphPosition {
  x: number;
  y: number;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 72;
const PADDING = 48;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const clampPosition = (position: GraphPosition, size: LayoutSize): GraphPosition => ({
  x: clamp(position.x, PADDING, Math.max(PADDING, size.width - NODE_WIDTH - PADDING)),
  y: clamp(position.y, PADDING, Math.max(PADDING, size.height - NODE_HEIGHT - PADDING)),
});

export const computeInitialLayout = (
  members: LayoutMember[],
  debts: LayoutDebt[],
  size: LayoutSize
): Record<string, GraphPosition> => {
  if (members.length === 0) {
    return {};
  }

  const centerX = size.width / 2 - NODE_WIDTH / 2;
  const centerY = size.height / 2 - NODE_HEIGHT / 2;
  const radius = Math.max(96, Math.min(size.width, size.height) / 2 - 96);
  const positions = Object.fromEntries(
    members.map((member, index) => {
      const angle = (Math.PI * 2 * index) / members.length - Math.PI / 2;
      return [
        member.id,
        clampPosition(
          {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
          },
          size
        ),
      ];
    })
  );

  if (members.length < 6) {
    return positions;
  }

  for (let iteration = 0; iteration < 50; iteration += 1) {
    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        const a = positions[members[i].id];
        const b = positions[members[j].id];
        const dx = a.x - b.x || 0.01;
        const dy = a.y - b.y || 0.01;
        const distanceSquared = Math.max(dx * dx + dy * dy, 144);
        const distance = Math.sqrt(distanceSquared);
        const force = 12000 / distanceSquared;
        const moveX = (dx / distance) * force;
        const moveY = (dy / distance) * force;

        a.x += moveX;
        a.y += moveY;
        b.x -= moveX;
        b.y -= moveY;
      }
    }

    debts.forEach((debt) => {
      const source = positions[debt.fromUserId];
      const target = positions[debt.toUserId];
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const attraction = 0.018;

      source.x += dx * attraction;
      source.y += dy * attraction;
      target.x -= dx * attraction;
      target.y -= dy * attraction;
    });

    members.forEach((member) => {
      positions[member.id] = clampPosition(positions[member.id], size);
    });
  }

  return positions;
};

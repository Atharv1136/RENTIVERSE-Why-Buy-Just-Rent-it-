// Dynamic product image generator based on product name
export function getProductImage(productName: string): string {
  const name = productName.toLowerCase().trim();
  
  // Electronics
  if (name.includes('mouse') || name.includes('mice')) {
    return 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop';
  }
  if (name.includes('keyboard')) {
    return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop';
  }
  if (name.includes('laptop') || name.includes('computer')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop';
  }
  if (name.includes('camera')) {
    return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop';
  }
  if (name.includes('phone') || name.includes('mobile')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop';
  }
  if (name.includes('tablet') || name.includes('ipad')) {
    return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop';
  }
  if (name.includes('headphone') || name.includes('earphone')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop';
  }
  if (name.includes('speaker')) {
    return 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop';
  }
  if (name.includes('projector')) {
    return 'https://images.unsplash.com/photo-1478720568477-b906dcace3d5?w=400&h=300&fit=crop';
  }
  if (name.includes('monitor') || name.includes('screen')) {
    return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop';
  }

  // Tools & Equipment
  if (name.includes('drill') || name.includes('drilling')) {
    return 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop';
  }
  if (name.includes('hammer')) {
    return 'https://images.unsplash.com/photo-1567794051817-51c7d7eed03f?w=400&h=300&fit=crop';
  }
  if (name.includes('screwdriver')) {
    return 'https://images.unsplash.com/photo-1609205635122-7b8b1a3e5560?w=400&h=300&fit=crop';
  }
  if (name.includes('saw')) {
    return 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop';
  }
  if (name.includes('ladder')) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop';
  }

  // Furniture
  if (name.includes('chair') || name.includes('seat')) {
    return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop';
  }
  if (name.includes('table') || name.includes('desk')) {
    return 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=400&h=300&fit=crop';
  }
  if (name.includes('sofa') || name.includes('couch')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop';
  }
  if (name.includes('bed')) {
    return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop';
  }

  // Sports & Recreation
  if (name.includes('bike') || name.includes('bicycle')) {
    return 'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=400&h=300&fit=crop';
  }
  if (name.includes('football') || name.includes('soccer')) {
    return 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop';
  }
  if (name.includes('basketball')) {
    return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop';
  }
  if (name.includes('tennis')) {
    return 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=300&fit=crop';
  }
  if (name.includes('guitar')) {
    return 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop';
  }

  // Vehicles
  if (name.includes('car') || name.includes('vehicle')) {
    return 'https://images.unsplash.com/photo-1494976688153-ca3ce8ffe252?w=400&h=300&fit=crop';
  }
  if (name.includes('scooter')) {
    return 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop';
  }

  // Kitchen & Appliances
  if (name.includes('microwave')) {
    return 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400&h=300&fit=crop';
  }
  if (name.includes('refrigerator') || name.includes('fridge')) {
    return 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=300&fit=crop';
  }
  if (name.includes('washing machine') || name.includes('washer')) {
    return 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=300&fit=crop';
  }

  // Default fallback based on category keywords
  if (name.includes('electronic') || name.includes('tech')) {
    return 'https://images.unsplash.com/photo-1518892096458-28d240de252e?w=400&h=300&fit=crop';
  }
  if (name.includes('tool') || name.includes('equipment')) {
    return 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop';
  }
  if (name.includes('furniture')) {
    return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop';
  }

  // Generic fallback
  return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop';
}

export function getProductIcon(productName: string): string {
  const name = productName.toLowerCase().trim();
  
  // Return appropriate Lucide icon name
  if (name.includes('mouse') || name.includes('computer')) return 'Mouse';
  if (name.includes('keyboard')) return 'Keyboard';
  if (name.includes('camera')) return 'Camera';
  if (name.includes('phone')) return 'Smartphone';
  if (name.includes('headphone')) return 'Headphones';
  if (name.includes('drill')) return 'Drill';
  if (name.includes('hammer')) return 'Hammer';
  if (name.includes('chair')) return 'ArmChair';
  if (name.includes('bike')) return 'Bike';
  if (name.includes('car')) return 'Car';
  
  return 'Package'; // Default fallback
}
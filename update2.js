const fs = require('fs');
const file = 'app/(tabs)/inventory.tsx';
let content = fs.readFileSync(file, 'utf8');

const newRenderItem = `    const renderItem = ({ item }: { item: InventoryItem }) => {
        const pricesPayload = item.catalog_products?.catalog_prices_current;
        const marketPrice = Array.isArray(pricesPayload) ? pricesPayload[0]?.market_price : pricesPayload?.market_price;
        const currency = Array.isArray(pricesPayload) ? pricesPayload[0]?.currency : pricesPayload?.currency;
        const source = Array.isArray(pricesPayload) ? pricesPayload[0]?.source : pricesPayload?.source;
        const lastUpdated = Array.isArray(pricesPayload) ? pricesPayload[0]?.last_updated : pricesPayload?.last_updated;

        const usdMarketPrice = typeof marketPrice === 'number' ? toUsd(marketPrice, currency) : null;

        let deltaStr = '';
        let deltaColor = theme.mutedText;
        if (usdMarketPrice !== null && usdMarketPrice > 0 && item.listing_price > 0) {
            const diff = (item.listing_price - usdMarketPrice) / usdMarketPrice;
            const percentage = Math.abs(diff * 100).toFixed(1);
            if (diff > 0) {
                deltaStr = \`+\${percentage}%\`;
                deltaColor = '#10b981'; // Green (Listed above market)
            } else if (diff < 0) {
                deltaStr = \`-\${percentage}%\`;
                deltaColor = '#ef4444'; // Red (Listed below market)
            } else {
                deltaStr = \`0%\`;
            }
        }

        let unrealizedStr = null;
        if (item.cost_basis !== null && item.status !== 'SOLD' && item.listing_price > 0) {
            const profit = (item.listing_price - item.cost_basis) * item.quantity;
            unrealizedStr = \`Unrealized: $\${profit.toFixed(2)}\`;
        }

        const imageUrl = item.catalog_products?.image_url;
        const prod = item.catalog_products; // Alias for brevity
        const condition = (item as any).condition || (item as any).condition_label || (item as any).grade;

        return (
            <TouchableOpacity
                style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: 'row' }]}
                onPress={() => openEditModal(item)}
            >
                {/* Image */}
                <View style={[styles.thumbnailContainer, { backgroundColor: theme.border }]}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                            defaultSource={{ uri: 'https://via.placeholder.com/48x68?text=No+Image' }}
                        />
                    ) : (
                        <Ionicons name="image-outline" size={24} color={theme.mutedText} />
                    )}
                </View>

                {/* Content */}
                <View style={{ flex: 1, marginLeft: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    
                    {/* LEFT COLUMN */}
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.itemTitle, { color: theme.text, fontSize: 16, fontWeight: 'bold' }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={[{ color: theme.mutedText, fontSize: 13, marginTop: 4 }]} numberOfLines={2}>
                            {prod?.language_code === 'JA' ? (prod?.set_name_en ?? prod?.set_name) : (prod?.set_name || 'Unknown Set')} • {formatSetNumber(prod?.external_id, prod?.collector_number, prod?.language_code === 'JA' ? (prod?.set_name_en ?? prod?.set_name) : prod?.set_name, prod?.set_printed_total, prod?.set_total)}{displayRarity(prod || {}) ? \` • \${displayRarity(prod || {})}\` : ''}
                        </Text>

                        {/* CHIPS ROW */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                            {condition && (
                                <View style={{ backgroundColor: theme.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 }}>
                                    <Text style={{ fontSize: 11, color: theme.text, fontWeight: 'bold' }}>{condition}</Text>
                                </View>
                            )}
                            {item.quantity > 1 && (
                                <Text style={{ fontSize: 13, color: theme.mutedText, fontWeight: 'bold', marginRight: 6 }}>×{item.quantity}</Text>
                            )}
                            {filter === 'ALL' && (
                                <View style={[styles.badge, { backgroundColor: item.status === 'SOLD' ? '#d1e7dd' : theme.border, margin: 0, paddingHorizontal: 6, paddingVertical: 2 }]}>
                                    <Text style={[styles.badgeText, { color: item.status === 'SOLD' ? '#0f5132' : theme.text, fontSize: 10 }]}>{item.status}</Text>
                                </View>
                            )}
                        </View>

                        {unrealizedStr && (
                            <Text style={{ fontSize: 11, color: '#10b981', marginTop: 4, fontWeight: '500' }}>
                                {unrealizedStr}
                            </Text>
                        )}
                    </View>

                    {/* RIGHT COLUMN */}
                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                        {/* Top-right: actions row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <TouchableOpacity
                                style={{ padding: 4, opacity: openingId === item.catalog_product_id && item.catalog_product_id ? 0.5 : 1 }}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleOpenTcgPlayer(item);
                                }}
                                disabled={openingId === item.catalog_product_id && !!item.catalog_product_id}
                            >
                                <Ionicons name="open-outline" size={20} color={theme.mutedText} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: 8, padding: 4 }} onPress={(e) => {
                                e.stopPropagation();
                                openActionMenu(item);
                            }}>
                                <Ionicons name="ellipsis-vertical" size={20} color={theme.mutedText} />
                            </TouchableOpacity>
                        </View>

                        {/* Middle-right: Market block */}
                        <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: theme.mutedText, marginRight: 4, fontWeight: 'bold' }}>TCG</Text>
                                <Text style={{ color: theme.text, fontSize: 14 }}>
                                    {formatUsd(marketPrice, currency)}
                                </Text>
                            </View>
                            {lastUpdated && typeof marketPrice === 'number' ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                    <Text style={{ fontSize: 10, color: theme.mutedText }}>{source ?? 'MKT'}</Text>
                                    <Ionicons name="refresh-outline" size={10} color={theme.mutedText} style={{ marginHorizontal: 2 }} />
                                    <Text style={{ fontSize: 10, color: theme.mutedText }}>{formatTimeAgo(lastUpdated)}</Text>
                                </View>
                            ) : (
                                <Text style={{ fontSize: 10, color: theme.mutedText, marginTop: 2 }}>
                                    Missing cache
                                </Text>
                            )}
                        </View>

                        {/* Bottom-right: YOU block */}
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, color: theme.mutedText, marginRight: 4, fontWeight: 'bold' }}>YOU</Text>
                                <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold' }}>
                                    $\${item.listing_price}
                                </Text>
                            </View>
                            {deltaStr !== '' && (
                                <Text style={{ fontSize: 11, fontWeight: 'bold', color: deltaColor, marginTop: 2 }}>
                                    ({deltaStr})
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };`;

const regex = /    const renderItem = \(\{\s*item\s*\}\s*:\s*\{\s*item:\s*InventoryItem\s*\}\) => \{[\s\S]*?(?=\n    const filteredItems)/;
content = content.replace(regex, newRenderItem);
fs.writeFileSync(file, content, 'utf8');
console.log('done');

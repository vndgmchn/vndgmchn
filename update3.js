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

        let marketLabel = 'MKT';
        if (source === 'TCGCSV') marketLabel = 'TCG';
        if (source === 'SCRYDEX') marketLabel = 'SCR';

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
                style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12 }]}
                onPress={() => openEditModal(item)}
            >
                {/* Image */}
                <View style={[styles.thumbnailContainer, { backgroundColor: theme.border, width: 40, height: 56 }]}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={[styles.thumbnail, { width: 40, height: 56 }]}
                            resizeMode="cover"
                            defaultSource={{ uri: 'https://via.placeholder.com/48x68?text=No+Image' }}
                        />
                    ) : (
                        <Ionicons name="image-outline" size={20} color={theme.mutedText} />
                    )}
                </View>

                {/* Content */}
                <View style={{ flex: 1, marginLeft: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    {/* LEFT COLUMN */}
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.itemTitle, { color: theme.text, fontSize: 14, fontWeight: 'bold' }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={[{ color: theme.mutedText, fontSize: 11, marginTop: 2 }]} numberOfLines={2}>
                            {prod?.language_code === 'JA' ? (prod?.set_name_en ?? prod?.set_name) : (prod?.set_name || 'Unknown Set')} • {formatSetNumber(prod?.external_id, prod?.collector_number, prod?.language_code === 'JA' ? (prod?.set_name_en ?? prod?.set_name) : prod?.set_name, prod?.set_printed_total, prod?.set_total)}{displayRarity(prod || {}) ? \` • \${displayRarity(prod || {})}\` : ''}
                        </Text>

                        {/* CHIPS ROW */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                            {condition && (
                                <View style={{ backgroundColor: theme.border, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginRight: 4 }}>
                                    <Text style={{ fontSize: 9, color: theme.text, fontWeight: 'bold' }}>{condition}</Text>
                                </View>
                            )}
                            {item.quantity > 1 && (
                                <Text style={{ fontSize: 11, color: theme.mutedText, fontWeight: 'bold', marginRight: 4 }}>×{item.quantity}</Text>
                            )}
                            {filter === 'ALL' && (
                                <View style={[styles.badge, { backgroundColor: item.status === 'SOLD' ? '#d1e7dd' : theme.border, margin: 0, paddingHorizontal: 4, paddingVertical: 1 }]}>
                                    <Text style={[styles.badgeText, { color: item.status === 'SOLD' ? '#0f5132' : theme.text, fontSize: 9 }]}>{item.status}</Text>
                                </View>
                            )}
                        </View>

                        {unrealizedStr && (
                            <Text style={{ fontSize: 10, color: '#10b981', marginTop: 2, fontWeight: '500' }}>
                                {unrealizedStr}
                            </Text>
                        )}
                    </View>

                    {/* RIGHT COLUMN */}
                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                        {/* Top-right: actions row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <TouchableOpacity
                                style={{ padding: 2, opacity: openingId === item.catalog_product_id && item.catalog_product_id ? 0.5 : 1 }}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleOpenTcgPlayer(item);
                                }}
                                disabled={openingId === item.catalog_product_id && !!item.catalog_product_id}
                            >
                                <Ionicons name="open-outline" size={16} color={theme.mutedText} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: 4, padding: 2 }} onPress={(e) => {
                                e.stopPropagation();
                                openActionMenu(item);
                            }}>
                                <Ionicons name="ellipsis-vertical" size={16} color={theme.mutedText} />
                            </TouchableOpacity>
                        </View>

                        {/* Market/Listing prices stacked */}
                        <View style={{ alignItems: 'flex-end', marginTop: 2 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                <Text style={{ fontSize: 9, color: theme.mutedText, marginRight: 4, fontWeight: 'bold' }}>{marketLabel}</Text>
                                <Text style={{ color: theme.mutedText, fontSize: 12 }}>
                                    {formatUsd(marketPrice, currency)}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 9, color: theme.mutedText, marginRight: 4, fontWeight: 'bold' }}>YOU</Text>
                                <Text style={{ color: theme.primary, fontSize: 14, fontWeight: 'bold' }}>
                                    $\${item.listing_price.toFixed(2)}
                                </Text>
                            </View>
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

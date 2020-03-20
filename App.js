import React, {Component} from "react";
import {
    ScrollView,
    View,
    Text,
    FlatList,
    StyleSheet,
    Animated,
    TouchableHighlight,
    Dimensions,
} from "react-native";
import faker from "faker";
import MaskedView from "@react-native-community/masked-view";

let shouldMoveHeader = true;
const screenHorizontalGap = 10;
const headerGap = 10;
const screenWidth = Dimensions.get("window").width;

const AniamtedTouchableHightlight = Animated.createAnimatedComponent(
    TouchableHighlight,
);

const viewabilityConfig = {
    minimumViewTime: 0,
    viewAreaCoveragePercentThreshold: 75,
};

const data = Array.from({length: 10}).map(x => {
    return {
        title: faker.lorem.word(),
        items: [Array.from({length: 5}).map(x => faker.lorem.lines(5))],
    };
});

class Screen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedHeader: new Animated.Value(0),
            headerDimensions: {},
            contentDimensions: {},
            headerScrollPosition: 0,
        };

        this.handleViewableItemsChanged = this.handleViewableItemsChanged.bind(
            this,
        );
    }

    checkHeaderItemPosition(index) {
        const {
            headerDimensions,
            headerScrollPosition,
            contentDimensions,
        } = this.state;

        const isAllMeasurementDone =
            Object.keys(headerDimensions).length === data.length &&
            Object.keys(contentDimensions).length === data.length;

        const scrollStartPoint = headerScrollPosition + screenHorizontalGap;
        const scrollEndPoint =
            headerScrollPosition + screenWidth - screenHorizontalGap;

        const headerStartPoint =
            headerDimensions[index].x - screenHorizontalGap * 2;
        const headerEndPoint =
            headerDimensions[index].x +
            headerDimensions[index].width +
            screenHorizontalGap * 2;

        if (
            headerStartPoint >= scrollStartPoint &&
            headerEndPoint <= scrollEndPoint
        )
            return {headerPosition: "inside"};

        if (headerStartPoint < scrollStartPoint)
            return {headerPosition: "left"};

        if (headerEndPoint > scrollEndPoint)
            return {
                diff: headerEndPoint - scrollEndPoint,
                headerPosition: "right",
            };
    }

    checkIfHeaderShouldMove(headerPosition) {
        return !(headerPosition === "inside");
    }

    handleHeaderClick = index => {
        const {
            contentDimensions,
            headerDimensions,
            selectedHeader,
        } = this.state;

        Animated.spring(selectedHeader, {
            toValue: index,
            useNativeDriver: false,
        }).start();

        const isAllMeasurementDone =
            Object.keys(headerDimensions).length === data.length &&
            Object.keys(contentDimensions).length === data.length;

        if (this.contentScroll && isAllMeasurementDone) {
            const {headerPosition} = this.checkHeaderItemPosition(index);
            shouldMoveHeader = this.checkIfHeaderShouldMove(headerPosition);

            this.contentScroll.scrollToIndex({
                animated: true,
                index,
                viewOffset: 1,
            });
        }
    };

    handleViewableItemsChanged(info) {
        const {
            headerDimensions,
            selectedHeader,
            headerScrollPosition,
        } = this.state;
        if (!shouldMoveHeader) {
            return;
        }
        if (info.changed.length) {
            if (info.viewableItems.length) {
                const visibleItems = info.viewableItems.filter(
                    i => i.isViewable,
                );
                if (visibleItems.length) {
                    Animated.spring(selectedHeader, {
                        toValue: visibleItems[0].index,
                        useNativeDriver: false,
                    }).start();

                    const isAllMeasurementDone =
                        Object.keys(headerDimensions).length === data.length;

                    if (this.headerScroll && isAllMeasurementDone) {
                        const {
                            headerPosition,
                            diff,
                        } = this.checkHeaderItemPosition(visibleItems[0].index);

                        if (this.checkIfHeaderShouldMove(headerPosition)) {
                            this.headerScroll.scrollTo({
                                animated: true,
                                x:
                                    headerPosition === "right"
                                        ? headerScrollPosition +
                                          diff +
                                          headerGap * 1
                                        : headerDimensions[
                                              visibleItems[0].index
                                          ].x -
                                          headerGap * 1,
                            });
                        }
                    }
                }
            }
        }
    }

    render() {
        const {
            selectedHeader,
            headerDimensions,
            contentDimensions,
            selectedHeaderValue,
        } = this.state;

        let width = 0;
        let translateX = 0;
        let scaleX = 0;
        let color = "black";
        let borderRadius = 0;
        const baseRadius = 35;
        const baseWidth = 50;

        const measurements = Object.keys(headerDimensions).map(
            k => headerDimensions[k],
        );
        const isAllMeasurementDone = measurements.length === data.length;

        if (isAllMeasurementDone) {
            width = selectedHeader.interpolate({
                inputRange: data.map((d, i) => i),
                outputRange: measurements.map(k => k.width + 20),
            });
            translateX = selectedHeader.interpolate({
                inputRange: data.map((_tab, i) => i),
                outputRange: measurements.map((_, i) => _.x - 10),
            });
            borderRadius = selectedHeader.interpolate({
                inputRange: measurements.map((_tab, i) => i),
                outputRange: measurements.map(
                    k => (k.width / k.height) * baseRadius,
                ),
            });
        }

        const maskElement = (
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        backgroundColor: isAllMeasurementDone
                            ? "black"
                            : "white",
                        borderRadius: isAllMeasurementDone ? borderRadius : 25,
                        width: isAllMeasurementDone ? width : "100%",
                        height: "100%",
                        transform: [{translateX}],
                    },
                ]}
            />
        );

        return (
            <View
                style={{
                    marginTop: 50,
                    marginBottom: 70,
                    marginHorizontal: screenHorizontalGap,
                }}
            >
                <ScrollView
                    ref={_ref => (this.headerScroll = _ref)}
                    style={{marginBottom: 10}}
                    horizontal
                    onScroll={e =>
                        this.setState({
                            headerScrollPosition: e.nativeEvent.contentOffset.x,
                        })
                    }
                    scrollEventThrottle={1}
                    showsHorizontalScrollIndicator={false}
                >
                    <Animated.View
                        style={{
                            width: "100%",
                            flex: 1,
                        }}
                    >
                        <MaskedView
                            style={{
                                width: "100%",
                                flexDirection: "row",
                            }}
                            maskElement={maskElement}
                        >
                            {data.map((item, index) => {
                                color = selectedHeader.interpolate({
                                    inputRange: data.map((_tab, i) => i),
                                    outputRange: data.map((_tab, i) => {
                                        if (index === i) return "white";
                                        return "black";
                                    }),
                                });

                                return (
                                    <AniamtedTouchableHightlight
                                        key={index}
                                        underlayColor="transparent"
                                        onPress={() =>
                                            this.handleHeaderClick(index)
                                        }
                                        style={{
                                            marginHorizontal: headerGap,
                                            padding: 10,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                        onLayout={e => {
                                            let item = {};
                                            if (headerDimensions[index])
                                                item = JSON.parse(
                                                    JSON.stringify(
                                                        headerDimensions[index],
                                                    ),
                                                );

                                            const {
                                                width,
                                                height,
                                                x,
                                                y,
                                            } = e.nativeEvent.layout;
                                            item.width = width;
                                            item.height = height;
                                            item.x = x;
                                            item.y = y;
                                            headerDimensions[index] = item;
                                            this.setState({
                                                headerDimensions,
                                            });
                                        }}
                                    >
                                        <Animated.Text
                                            style={{
                                                textAlignVertical: "center",
                                                textAlign: "center",
                                                fontSize: 12,
                                                color: color,
                                            }}
                                        >
                                            {item.title}
                                        </Animated.Text>
                                    </AniamtedTouchableHightlight>
                                );
                            })}
                        </MaskedView>
                    </Animated.View>
                </ScrollView>

                <FlatList
                    onScrollBeginDrag={() => (shouldMoveHeader = true)}
                    initialNumToRender={1}
                    ref={_ref => (this.contentScroll = _ref)}
                    showsVerticalScrollIndicator={false}
                    viewabilityConfig={viewabilityConfig}
                    onViewableItemsChanged={this.handleViewableItemsChanged}
                    scrollEventThrottle={1}
                    keyExtractor={(item, index) => index.toString()}
                    data={data}
                    renderItem={({item, index}) => {
                        return (
                            <Animated.View
                                onLayout={e => {
                                    let item = {};
                                    if (contentDimensions[index])
                                        item = JSON.parse(
                                            JSON.stringify(
                                                contentDimensions[index],
                                            ),
                                        );

                                    const {
                                        width,
                                        height,
                                        x,
                                        y,
                                    } = e.nativeEvent.layout;
                                    item.width = width;
                                    item.height = height;
                                    item.x = x;
                                    item.y = y;
                                    contentDimensions[index] = item;
                                    this.setState({
                                        contentDimensions,
                                    });
                                }}
                                style={{
                                    flex: 1,
                                    width: "95%",
                                    borderRadius: 10,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginTop: 30,
                                    elevation: 1,
                                    paddingHorizontal: 5,
                                    paddingVertical: 20,
                                }}
                            >
                                <Text
                                    style={{
                                        textAlignVertical: "center",
                                        textAlign: "left",
                                        fontSize: 20,
                                        marginBottom: 20,
                                    }}
                                >
                                    {item.title}
                                </Text>
                                {item.items.map((child, childIndex) => {
                                    return (
                                        <View
                                            key={childIndex}
                                            style={{
                                                width: "95%",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlignVertical: "center",
                                                    textAlign: "justify",
                                                    fontSize: 14,
                                                }}
                                            >
                                                {child}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </Animated.View>
                        );
                    }}
                />
            </View>
        );
    }
}

export default Screen;

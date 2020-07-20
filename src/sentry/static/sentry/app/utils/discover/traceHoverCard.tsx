import React from 'react';
import {Location, LocationDescriptor} from 'history';
import styled from '@emotion/styled';

import {t} from 'app/locale';
import withApi from 'app/utils/withApi';
import {Client} from 'app/api';
import Hovercard from 'app/components/hovercard';
import Version from 'app/components/version';
import space from 'app/styles/space';
import Clipboard from 'app/components/clipboard';
import {IconCopy} from 'app/icons';
import {TableData} from 'app/views/eventsV2/table/types';
import LoadingIndicator from 'app/components/loadingIndicator';
import LoadingError from 'app/components/loadingError';

import EventView from './eventView';
import DiscoverQuery from './discoverQuery';

type ChildrenProps = {to: LocationDescriptor};

type Props = {
  api: Client;

  orgId: string;
  traceId: string;

  location: Location;

  children: (props: ChildrenProps) => React.ReactNode;

  // hover card props
  containerClassName: string;
};

class TraceHoverCard extends React.Component<Props> {
  renderHeader() {
    const {traceId} = this.props;

    return (
      <HeaderWrapper>
        <span>{t('Trace')}</span>
        <TraceWrapper>
          <StyledTrace version={traceId} truncate anchor={false} />
          <Clipboard value={traceId}>
            <ClipboardIconWrapper>
              <IconCopy size="xs" />
            </ClipboardIconWrapper>
          </Clipboard>
        </TraceWrapper>
      </HeaderWrapper>
    );
  }

  renderBody({
    tableData,
    isLoading,
    error,
  }: {
    tableData: TableData | null;
    isLoading: boolean;
    error: null | string;
  }) {
    if (isLoading) {
      return (
        <LoadingWrapper>
          <LoadingIndicator mini />
        </LoadingWrapper>
      );
    }

    if (error) {
      return <LoadingError />;
    }

    if (!tableData) {
      return null;
    }

    const numOfTransactions = tableData?.data.length ?? 0;

    return (
      <div>
        <div>
          <h6>{t('Transactions')}</h6>
          <div className="count-since">{numOfTransactions}</div>
        </div>
      </div>
    );
  }

  render() {
    const {traceId, location, api, orgId} = this.props;
    const traceEventView = EventView.fromNewQueryWithLocation(
      {
        id: undefined,
        name: `Transactions with Trace ID ${traceId}`,
        fields: [
          'transaction',
          'project',
          'trace.span',
          'transaction.duration',
          'timestamp',
        ],
        orderby: '-timestamp',
        query: `event.type:transaction trace:${traceId}`,
        projects: [],
        version: 2,
      },
      location
    );

    const to = traceEventView.getResultsViewUrlTarget(orgId);

    return (
      <DiscoverQuery
        api={api}
        location={location}
        eventView={traceEventView}
        orgSlug={orgId}
      >
        {({isLoading, error, tableData}) => {
          return (
            <Hovercard
              {...this.props}
              header={this.renderHeader()}
              body={this.renderBody({isLoading, error, tableData})}
            >
              {this.props.children({to})}
            </Hovercard>
          );
        }}
      </DiscoverQuery>
    );
  }
}

const HeaderWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TraceWrapper = styled('div')`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
`;

const StyledTrace = styled(Version)`
  margin-right: ${space(0.5)};
  max-width: 190px;
`;

const ClipboardIconWrapper = styled('span')`
  &:hover {
    cursor: pointer;
  }
`;

const LoadingWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default withApi(TraceHoverCard);
